"""etl/rules.py 단위 테스트.

실제 제공 데이터에 등장하는 값(이슈 번호를 주석으로 표기)을 입력으로 사용한다.
"""
import datetime as dt
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from etl import rules  # noqa: E402


class ToHoursTest(unittest.TestCase):
    def test_hour_unit_is_returned_as_is(self):
        # HRG-1013 2025-07-25: 8,h
        self.assertEqual(rules.to_hours("8", "h"), 8.0)

    def test_day_unit_is_converted_with_8_hours_per_day(self):
        # HRG-1013 2025-08-11: 1,d  /  JSON HRG-1032 "18d 2h" = 525600s = 146h → 1d=8h
        self.assertEqual(rules.to_hours("1", "d"), 8.0)
        self.assertEqual(rules.to_hours("0.5", "d"), 4.0)
        self.assertEqual(rules.to_hours("1.0", "d"), 8.0)

    def test_hours_per_day_is_configurable(self):
        self.assertEqual(rules.to_hours("2", "d", hours_per_day=6), 12.0)

    def test_zero_is_allowed(self):
        # HRG-1279 2025-09-02: 0,h
        self.assertEqual(rules.to_hours("0", "h"), 0.0)

    def test_unknown_unit_raises(self):
        with self.assertRaises(ValueError):
            rules.to_hours("3", "m")

    def test_negative_raises(self):
        with self.assertRaises(ValueError):
            rules.to_hours("-1", "h")

    def test_non_numeric_raises(self):
        with self.assertRaises(ValueError):
            rules.to_hours("", "h")


class ParseDurationTest(unittest.TestCase):
    def test_hours_suffix(self):
        self.assertEqual(rules.parse_duration("120h"), 120.0)

    def test_jira_compound_string(self):
        # JSON HRG-1032 timetracking.timeSpent = "18d 2h" (timeSpentSeconds 525600)
        self.assertEqual(rules.parse_duration("18d 2h"), 146.0)
        self.assertEqual(rules.parse_duration("30d"), 240.0)

    def test_week_is_five_days(self):
        self.assertEqual(rules.parse_duration("1w 1d"), 48.0)

    def test_empty_is_none(self):
        self.assertIsNone(rules.parse_duration(""))
        self.assertIsNone(rules.parse_duration(None))

    def test_garbage_raises(self):
        with self.assertRaises(ValueError):
            rules.parse_duration("abc")


class VersionTest(unittest.TestCase):
    def test_split_multi_versions(self):
        # HRG-1031: "v1.8,v1.9"
        self.assertEqual(rules.parse_versions("v1.8,v1.9"), ["v1.8", "v1.9"])

    def test_version_order_is_numeric_not_lexical(self):
        self.assertEqual(rules.parse_versions("v1.10,v1.9"), ["v1.9", "v1.10"])

    def test_empty_versions(self):
        self.assertEqual(rules.parse_versions(""), [])

    def test_multi_version_goes_to_version_of_sibling_issues(self):
        # EPIC-624: HRG-1101 기획 "v1.3,v1.4", 나머지 형제 이슈는 전부 v1.3
        self.assertEqual(rules.delivery_version(["v1.3", "v1.4"], {"v1.3"}), "v1.3")

    def test_multi_version_falls_back_to_last_when_siblings_do_not_decide(self):
        # EPIC-GLD: HRG-1031 "v1.8,v1.9", 형제는 v1.9 → v1.9
        self.assertEqual(rules.delivery_version(["v1.8", "v1.9"], {"v1.9"}), "v1.9")
        # 형제가 없거나 양쪽 모두에 있으면 마지막 버전
        self.assertEqual(rules.delivery_version(["v1.8", "v1.9"], set()), "v1.9")
        self.assertEqual(rules.delivery_version(["v1.8", "v1.9"], {"v1.8", "v1.9"}), "v1.9")

    def test_single_version_is_itself(self):
        self.assertEqual(rules.delivery_version(["v2.0"], {"v1.9"}), "v2.0")

    def test_no_version_is_none(self):
        self.assertIsNone(rules.delivery_version([], {"v1.9"}))


class ProcessTest(unittest.TestCase):
    def test_planner_story_is_plan(self):
        # HRG-1012 신규 각성 시스템 - 기획 / pd_lee
        self.assertEqual(rules.process_of("planner", "Story", "신규 각성 시스템 - 기획"), ("plan", False))

    def test_server_and_client_are_dev(self):
        self.assertEqual(rules.process_of("server", "Story", "신규 각성 시스템 - 서버"), ("dev", False))
        self.assertEqual(rules.process_of("client", "Story", "신규 각성 시스템 - 클라"), ("dev", False))

    def test_vendor_art_is_art(self):
        # HRG-1015 각성 이펙트 리소스 / art_outsource01
        self.assertEqual(rules.process_of("art", "Task", "각성 이펙트 리소스"), ("art", False))

    def test_qa_reject_bug_is_dev_rework(self):
        # HRG-1016 각성 시스템 QA 반려 1차 / dev_jung
        self.assertEqual(rules.process_of("server", "Bug", "각성 시스템 QA 반려 1차"), ("dev", True))

    def test_unknown_role_is_unassigned(self):
        # HRG-1072 봄 시즌 콘텐츠 - 기획 / assignee 비어 있음
        self.assertEqual(rules.process_of(None, "Story", "봄 시즌 콘텐츠 - 기획"), ("unassigned", False))

    def test_suffix_role_conflict_is_detected(self):
        self.assertTrue(rules.suffix_conflicts("server", "신규 각성 시스템 - 기획"))
        self.assertFalse(rules.suffix_conflicts("planner", "신규 각성 시스템 - 기획"))
        self.assertFalse(rules.suffix_conflicts("client", "길드전 UI"))


class BusinessDayTest(unittest.TestCase):
    HOL = {"2025-10-03", "2025-10-06", "2025-10-07", "2025-10-08", "2025-10-09"}

    def test_weekends_and_holidays_are_excluded(self):
        # 2025-10-02(목) ~ 2025-10-10(금): 추석 연휴 10/3, 10/6~9 → 10/2, 10/10 두 날
        days = list(rules.business_days(dt.date(2025, 10, 2), dt.date(2025, 10, 10), self.HOL))
        self.assertEqual(days, [dt.date(2025, 10, 2), dt.date(2025, 10, 10)])

    def test_same_day_range(self):
        self.assertEqual(len(list(rules.business_days(dt.date(2025, 9, 22), dt.date(2025, 9, 22), set()))), 1)

    def test_reversed_range_is_empty(self):
        self.assertEqual(list(rules.business_days(dt.date(2025, 9, 23), dt.date(2025, 9, 22), set())), [])

    def test_subtract_business_days_skips_holidays(self):
        # 2025-10-10(금)에서 1 영업일 전 = 10/2(목) (10/3~10/9 휴일+주말)
        self.assertEqual(rules.sub_business_days(dt.date(2025, 10, 10), 1, self.HOL), dt.date(2025, 10, 2))

    def test_subtract_zero_returns_same_business_day(self):
        self.assertEqual(rules.sub_business_days(dt.date(2025, 10, 10), 0, self.HOL), dt.date(2025, 10, 10))

    def test_subtract_zero_from_holiday_moves_back(self):
        self.assertEqual(rules.sub_business_days(dt.date(2025, 10, 6), 0, self.HOL), dt.date(2025, 10, 2))


class OccupancyTest(unittest.TestCase):
    def test_single_issue_full_availability(self):
        # 5 영업일, 가용률 1.0, 동시 1건 → 5.0 MD
        days = [dt.date(2025, 9, 22) + dt.timedelta(d) for d in range(5)]
        self.assertAlmostEqual(rules.occupancy_md(days, 1.0, {d: 1 for d in days}, set()), 5.0)

    def test_concurrency_and_availability_divide_capacity(self):
        # 가용률 0.9, 2건 동시 진행 → 하루 0.45 MD
        days = [dt.date(2025, 9, 22), dt.date(2025, 9, 23)]
        self.assertAlmostEqual(rules.occupancy_md(days, 0.9, {d: 2 for d in days}, set()), 0.9)

    def test_pto_days_contribute_nothing(self):
        days = [dt.date(2025, 9, 22), dt.date(2025, 9, 23)]
        self.assertAlmostEqual(
            rules.occupancy_md(days, 1.0, {d: 1 for d in days}, {dt.date(2025, 9, 23)}), 1.0)

    def test_missing_concurrency_counts_as_one(self):
        days = [dt.date(2025, 9, 22)]
        self.assertAlmostEqual(rules.occupancy_md(days, 0.8, {}, set()), 0.8)


class RobustBaselineTest(unittest.TestCase):
    def test_median_of_last_three_ignores_single_outlier(self):
        # 최근 3개 버전 [10, 11, 40] → 중앙값 11, 40은 이상치
        res = rules.robust_update([8, 10, 11, 40], window=3)
        self.assertEqual(res["value"], 11)
        self.assertEqual(res["outliers"], [40])

    def test_outlier_by_mad(self):
        self.assertTrue(rules.is_outlier(40, [10, 11, 12]))
        self.assertFalse(rules.is_outlier(12, [10, 11, 13]))

    def test_all_identical_history_is_not_outlier_for_same_value(self):
        self.assertFalse(rules.is_outlier(10, [10, 10, 10]))
        self.assertTrue(rules.is_outlier(15, [10, 10, 10]))

    def test_too_few_samples_keeps_previous(self):
        res = rules.robust_update([12], window=3, min_samples=2, previous=15)
        self.assertEqual(res["value"], 15)
        self.assertEqual(res["reason"], "insufficient_samples")

    def test_change_ratio_is_reported(self):
        res = rules.robust_update([10, 12, 14], window=3, previous=10)
        self.assertAlmostEqual(res["change_ratio"], 0.2)


if __name__ == "__main__":
    unittest.main()
