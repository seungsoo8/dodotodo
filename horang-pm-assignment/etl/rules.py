"""MD 계산 규칙(순수 함수 모음).

설계 근거는 docs/A_data_diagnosis.md 의 A-2 정의를 따른다.
설정값(하루 시간 수, 이상치 임계 등)은 etl/config.json 에서 주입하며 여기서는 기본값만 둔다.
"""
from __future__ import annotations

import datetime as dt
import re
import statistics
from typing import Iterable, Iterator

HOURS_PER_DAY = 8.0  # Jira 기본값. JSON HRG-1032 "18d 2h" = 525600s = 146h 로 확인
DAYS_PER_WEEK = 5.0

_UNIT_HOURS = {"h": 1.0}


def to_hours(value: str, unit: str, hours_per_day: float = HOURS_PER_DAY) -> float:
    """worklog 한 줄의 time_spent + unit 을 시간으로 정규화한다."""
    try:
        v = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"time_spent 가 숫자가 아님: {value!r}")
    if v < 0:
        raise ValueError(f"음수 작업량: {value!r}")
    if unit == "h":
        return v
    if unit == "d":
        return v * hours_per_day
    raise ValueError(f"알 수 없는 단위: {unit!r}")


_DUR_TOKEN = re.compile(r"(\d+(?:\.\d+)?)([wdhm])")


def parse_duration(text: str | None, hours_per_day: float = HOURS_PER_DAY) -> float | None:
    """Jira 기간 문자열("120h", "18d 2h", "1w 1d")을 시간으로 바꾼다. 빈 값은 None."""
    if text is None or str(text).strip() == "":
        return None
    s = str(text).replace(" ", "")
    tokens = _DUR_TOKEN.findall(s)
    if not tokens or "".join(n + u for n, u in tokens) != s:
        raise ValueError(f"기간 문자열 해석 불가: {text!r}")
    per = {"w": hours_per_day * DAYS_PER_WEEK, "d": hours_per_day, "h": 1.0, "m": 1 / 60}
    return sum(float(n) * per[u] for n, u in tokens)


def _vkey(v: str) -> tuple:
    return tuple(int(x) for x in re.findall(r"\d+", v))


def parse_versions(text: str | None) -> list[str]:
    if not text:
        return []
    return sorted({v.strip() for v in text.split(",") if v.strip()}, key=_vkey)


def delivery_version(versions: list[str], sibling_versions: set[str]) -> str | None:
    """이슈 하나를 어느 버전의 실적으로 셀지 정한다.

    다중 버전 이슈는 같은 에픽의 단일 버전 형제 이슈들이 가리키는 버전이 후보 중 정확히 하나면 그 버전,
    아니면 마지막(가장 늦은) 버전으로 본다. (예: EPIC-624 HRG-1101 → v1.3)
    """
    if not versions:
        return None
    if len(versions) == 1:
        return versions[0]
    hits = [v for v in versions if v in sibling_versions]
    if len(hits) == 1:
        return hits[0]
    return sorted(versions, key=_vkey)[-1]


ROLE_PROCESS = {"planner": "plan", "server": "dev", "client": "dev", "art": "art"}
QA_REJECT = re.compile(r"QA\s*반려")
_SUFFIX_ROLE = {"기획": {"planner"}, "서버": {"server"}, "클라": {"client"}, "개발": {"server", "client"}}


def process_of(role: str | None, issue_type: str, summary: str) -> tuple[str, bool]:
    """(공정, 재작업 여부). 공정은 담당자 직군(people.csv role)으로 귀속한다."""
    proc = ROLE_PROCESS.get(role or "", "unassigned")
    rework = issue_type == "Bug" and bool(QA_REJECT.search(summary or ""))
    return proc, rework


def suffix_conflicts(role: str | None, summary: str) -> bool:
    """제목 접미사(" - 기획" 등)가 담당자 직군과 어긋나면 True → 수동 검토 대상."""
    m = re.search(r" - (\S+)$", summary or "")
    if not m or m.group(1) not in _SUFFIX_ROLE:
        return False
    return (role or "") not in _SUFFIX_ROLE[m.group(1)]


def is_business_day(d: dt.date, holidays: set) -> bool:
    return d.weekday() < 5 and d.isoformat() not in holidays and d not in holidays


def business_days(start: dt.date, end: dt.date, holidays: set) -> Iterator[dt.date]:
    d = start
    while d <= end:
        if is_business_day(d, holidays):
            yield d
        d += dt.timedelta(days=1)


def sub_business_days(d: dt.date, n: int, holidays: set) -> dt.date:
    """d 이전(또는 d 자신)의 가장 가까운 영업일에서 n 영업일 앞으로 이동."""
    while not is_business_day(d, holidays):
        d -= dt.timedelta(days=1)
    while n > 0:
        d -= dt.timedelta(days=1)
        if is_business_day(d, holidays):
            n -= 1
    return d


def occupancy_md(days: Iterable[dt.date], availability: float, concurrency: dict, pto: set) -> float:
    """기간 점유 MD = Σ(영업일) 가용률 ÷ 그날 동시 진행 건수. 연차일은 0."""
    total = 0.0
    for d in days:
        if d in pto:
            continue
        total += availability / max(1, concurrency.get(d, 1))
    return total


def is_outlier(x: float, ref: list[float], k: float = 3.0, floor_ratio: float = 0.1) -> bool:
    """MAD 기반 이상치 판정. MAD 가 0 에 가까우면 중앙값의 floor_ratio 를 하한으로 쓴다."""
    if not ref:
        return False
    med = statistics.median(ref)
    mad = statistics.median([abs(r - med) for r in ref])
    scale = max(mad, abs(med) * floor_ratio, 1e-9)
    return abs(x - med) > k * scale


def robust_update(history: list[float], window: int = 3, min_samples: int = 2,
                  previous: float | None = None, k: float = 3.0) -> dict:
    """버전별 실측값 이력으로 새 기준값 후보를 만든다.

    - 최근 window 개 버전의 중앙값을 후보로 한다(한 버전이 튀어도 중앙값은 움직이지 않음).
    - window 안에서 나머지 값 대비 MAD 이상치인 값을 outliers 로 보고해 승인자가 보게 한다.
    """
    recent = list(history[-window:])
    if len(recent) < min_samples:
        return {"value": previous, "reason": "insufficient_samples", "outliers": [],
                "samples": recent, "change_ratio": 0.0}
    outliers = [x for idx, x in enumerate(recent)
                if len(recent) > 2 and is_outlier(x, recent[:idx] + recent[idx + 1:], k)]
    value = statistics.median(recent)
    change = (value - previous) / previous if previous else None
    return {"value": value, "reason": "ok", "outliers": outliers, "samples": recent,
            "change_ratio": change}
