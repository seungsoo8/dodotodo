type Lang = 'ko' | 'en';

// [day 0=일~6=토][hour 0~23]
const GREETINGS: [string, string][][] = [
  // ── 일요일 (0) ────────────────────────────────────────────────
  [
    ['잠들기 아쉬운 일요일 밤이에요 🌚',              'Sunday night — still not sleeping? 🌚'],       // 0
    ['고요한 일요일 새벽이에요 🌛',                   'A quiet Sunday night 🌛'],                     // 1
    ['내일도 쉬는 날이에요, 푹 주무세요 🌃',          'Rest up — no rush tomorrow 🌃'],               // 2
    ['늦게까지 즐기셨군요, 이제 쉬어요 🌙',           'Hope you enjoyed the night — time to rest 🌙'], // 3
    ['일요일 새벽빛이 물들어요 🌌',                   'Sunday dawn is near 🌌'],                      // 4
    ['일요일 이른 새벽이에요 🌄',                     'Early Sunday morning 🌄'],                     // 5
    ['일요일 아침이 밝았어요 🌅',                     'Sunday morning is here 🌅'],                   // 6
    ['일요일 아침, 느긋하게 시작해요 🌤️',            'Lazy Sunday morning 🌤️'],                     // 7
    ['여유로운 일요일 아침이에요 ☕',                  'Relaxing Sunday morning ☕'],                   // 8
    ['일요일 오전, 브런치 어떠세요? 🥞',              'Sunday brunch time? 🥞'],                      // 9
    ['일요일 오전, 산책이라도 해볼까요? 🌿',          'A Sunday stroll sounds nice 🌿'],              // 10
    ['일요일 오전이 끝나가요 🕚',                     'Sunday morning wrapping up 🕚'],               // 11
    ['일요일 점심, 맛있는 거 드세요 🍽️',             'Sunday lunch — make it good 🍽️'],             // 12
    ['일요일 점심 후, 낮잠 어떠세요? 😴',            'Post-lunch Sunday nap? 😴'],                   // 13
    ['일요일 오후, 충전 중이에요? 🔋',               'Sunday afternoon recharge 🔋'],                // 14
    ['일요일 오후, 어디 나가셨어요? 🌞',             'Out and about on Sunday? 🌞'],                 // 15
    ['일요일 오후, 내일을 위해 천천히 마무리해요 🌇', 'Sunday winding down before the week 🌇'],      // 16
    ['일요일 저녁 준비 시간이에요 🍳',                'Time to cook Sunday dinner 🍳'],               // 17
    ['주말의 마지막 저녁이에요 🌆',                   'Last evening of the weekend 🌆'],              // 18
    ['일요일 저녁, 내일을 위해 쉬어요 📖',           'Sunday evening — rest up for tomorrow 📖'],    // 19
    ['내일 월요일이에요, 슬슬 준비해요 📋',           'Monday is coming — get ready 📋'],             // 20
    ['내일 월요일, 일찍 마무리해요 🌙',               'Early night before Monday 🌙'],                // 21
    ['내일 월요일이에요, 일찍 주무세요 🌙',           'Monday tomorrow — rest up 🌙'],                // 22
    ['슬슬 잠자리에 들 시간이에요 😴',               'Time to drift off to sleep 😴'],               // 23
  ],

  // ── 월요일 (1) ────────────────────────────────────────────────
  [
    ['한 주의 시작이에요, 일찍 주무세요 🌚',          'New week ahead — get some rest 🌚'],           // 0
    ['조용한 월요일 새벽이에요 🌛',                   'Quiet Monday night 🌛'],                       // 1
    ['새벽에도 깨어 계시군요 🌃',                     'Still up at this hour? 🌃'],                   // 2
    ['한밤중에도 쉬지 않으시는군요 💙',               'Working through the night? 💙'],               // 3
    ['월요일 새벽빛이 물들어요 🌌',                   'Monday dawn is near 🌌'],                      // 4
    ['월요일 이른 새벽이에요 🌄',                     'Early Monday morning 🌄'],                     // 5
    ['한 주의 시작, 아침이 밝았어요 🌅',              'A new week begins 🌅'],                        // 6
    ['월요일 아침, 힘차게 시작해요 ☀️',               'Monday morning — let\'s go ☀️'],              // 7
    ['한 주의 시작, 상쾌하게 시작해요 🌤️',           'Fresh start to the week 🌤️'],                 // 8
    ['월요일 오전, 파이팅이에요 💪',                  'Monday morning, you got this 💪'],             // 9
    ['월요일 오전이에요 🎯',                          'Monday morning 🎯'],                           // 10
    ['월요일 첫날 절반 왔어요 🕚',                    'Halfway through Monday 🕚'],                   // 11
    ['월요일 점심, 맛있게 드세요 🍱',                 'Monday lunch — enjoy 🍱'],                     // 12
    ['월요일 점심 후, 나른하지 않으세요? 😅',         'Post-lunch Monday slump? 😅'],                 // 13
    ['월요일 오후도 화이팅이에요 ⚡',                  'Monday afternoon, keep it up ⚡'],             // 14
    ['월요일 오후, 커피 한 잔 어떠세요? ☕',           'Monday afternoon — need a coffee? ☕'],         // 15
    ['월요일 오후, 조금만 더 힘내요 🏃',               'Monday afternoon — keep pushing 🏃'],          // 16
    ['월요일 퇴근 시간이에요 🚶',                     'Monday clocking out time 🚶'],                 // 17
    ['월요일 퇴근길, 수고했어요 🌆',                  'Monday commute — well done 🌆'],               // 18
    ['월요일 저녁이에요 🍽️',                         'Monday evening 🍽️'],                          // 19
    ['한 주의 첫날, 잘 마무리했어요 ✅',               'First day of the week — done ✅'],             // 20
    ['월요일도 잘 버텼어요 🌙',                       'Made it through Monday 🌙'],                   // 21
    ['내일 화요일이에요, 일찍 주무세요 ⭐',            'Tuesday tomorrow — rest up ⭐'],               // 22
    ['월요일이 끝나가요 🌚',                          'Monday almost over 🌚'],                       // 23
  ],

  // ── 화요일 (2) ────────────────────────────────────────────────
  [
    ['조용한 화요일이 시작됐어요 🌚',                 'Tuesday is here quietly 🌚'],                  // 0
    ['밤이 깊어가는 화요일이에요 🌛',                 'Deep into Tuesday night 🌛'],                  // 1
    ['새벽 공기를 마시고 계신가요? 🌃',              'The night air is fresh 🌃'],                   // 2
    ['이 시간에도 깨어 계시는군요 💙',               'Still awake at this hour? 💙'],                // 3
    ['화요일 새벽빛이 물들어요 🌌',                   'Tuesday dawn is near 🌌'],                     // 4
    ['화요일 이른 새벽이에요 🌄',                     'Early Tuesday morning 🌄'],                    // 5
    ['화요일 아침이 밝았어요 🌅',                     'Tuesday morning is here 🌅'],                  // 6
    ['화요일 아침, 어제보다 잘 될 거예요 🌤️',        'Tuesday — better than Monday 🌤️'],            // 7
    ['화요일 아침이에요 ☀️',                          'Tuesday morning ☀️'],                          // 8
    ['화요일 오전이에요 🎯',                          'Tuesday morning 🎯'],                          // 9
    ['화요일 오전, 집중해봐요 💡',                    'Tuesday — focus time 💡'],                     // 10
    ['화요일 오전이 끝나가요 🕚',                     'Tuesday morning wrapping up 🕚'],              // 11
    ['화요일 점심이에요 🍱',                          'Tuesday lunch 🍱'],                            // 12
    ['화요일 점심 후, 산책 어떠세요? 🌿',            'Post-lunch walk? 🌿'],                         // 13
    ['화요일 오후이에요 💼',                          'Tuesday afternoon 💼'],                        // 14
    ['화요일 오후, 잠깐 쉬어가요 ☕',                 'Tuesday afternoon — take a breather ☕'],       // 15
    ['화요일 오후, 차근차근 해봐요 🏃',               'Tuesday afternoon — one step at a time 🏃'],   // 16
    ['화요일 퇴근 시간이에요 🚶',                     'Tuesday clocking out 🚶'],                     // 17
    ['화요일 저녁이에요 🌆',                          'Tuesday evening 🌆'],                          // 18
    ['화요일 저녁, 맛있는 거 드세요 🍽️',             'Tuesday dinner — enjoy 🍽️'],                  // 19
    ['화요일도 잘 마무리했어요 ✅',                    'Tuesday done — well done ✅'],                 // 20
    ['화요일 밤이에요 🌙',                            'Tuesday night 🌙'],                            // 21
    ['내일 수요일이에요, 일찍 주무세요 ⭐',            'Wednesday tomorrow — rest up ⭐'],             // 22
    ['화요일이 끝나가요 🌚',                          'Tuesday almost over 🌚'],                      // 23
  ],

  // ── 수요일 (3) ────────────────────────────────────────────────
  [
    ['이번 주 반환점에 가까워지고 있어요 🌚',         'Getting close to the midweek mark 🌚'],        // 0
    ['고요한 수요일 새벽이에요 🌛',                   'Quiet Wednesday night 🌛'],                    // 1
    ['새벽빛이 스며드는 시간이에요 🌃',              'The night slowly fades 🌃'],                   // 2
    ['깊은 새벽, 조용히 쉬어요 💙',                  'Still up in the small hours 💙'],              // 3
    ['수요일 새벽빛이 물들어요 🌌',                   'Wednesday dawn is near 🌌'],                   // 4
    ['이번 주 절반 가는 날 새벽이에요 🌄',            'Midweek morning already 🌄'],                  // 5
    ['수요일 아침이 밝았어요 🌅',                     'Wednesday morning is here 🌅'],                // 6
    ['이번 주 절반 가는 날이에요 ⚖️',                'Halfway through the week ⚖️'],                 // 7
    ['수요일 아침이에요 ☀️',                          'Wednesday morning ☀️'],                        // 8
    ['수요일 오전, 고비를 넘겨봐요 💪',               'Wednesday — push through 💪'],                 // 9
    ['수요일 오전이에요 🎯',                          'Wednesday morning 🎯'],                        // 10
    ['주중 절반이 거의 됐어요 🕚',                    'Almost halfway through the week 🕚'],          // 11
    ['주중 점심이에요 🍜',                            'Midweek lunch 🍜'],                            // 12
    ['수요일 점심 후예요 😊',                         'Wednesday afternoon begins 😊'],               // 13
    ['절반 넘었어요! 이제 내리막이에요 🏃',            'Over the hump! Downhill from here 🏃'],        // 14
    ['수요일 오후, 거의 다 왔어요 ☕',                'Wednesday afternoon — almost there ☕'],        // 15
    ['수요일 오후, 마무리를 향해 달려요 🏁',          'Wednesday afternoon — racing to the finish 🏁'], // 16
    ['수요일 퇴근 시간이에요 🚶',                     'Wednesday clocking out 🚶'],                   // 17
    ['수요일 저녁이에요 🌆',                          'Wednesday evening 🌆'],                        // 18
    ['수요일 저녁, 잘 버텼어요 👏',                   'Wednesday done — nice work 👏'],               // 19
    ['이번 주 반환점 돌았어요 ✅',                     'Week is halfway done ✅'],                     // 20
    ['수요일 밤이에요 🌙',                            'Wednesday night 🌙'],                          // 21
    ['내일 목요일이에요, 일찍 주무세요 ⭐',            'Thursday tomorrow — rest up ⭐'],              // 22
    ['수요일이 끝나가요 🌚',                          'Wednesday almost over 🌚'],                    // 23
  ],

  // ── 목요일 (4) ────────────────────────────────────────────────
  [
    ['내일이면 불금이 보이기 시작해요 🌚',            'Friday is almost in sight 🌚'],                // 0
    ['고요한 목요일 새벽이에요 🌛',                   'Quiet Thursday night 🌛'],                     // 1
    ['깊은 밤, 내일을 위해 쉬어요 🌃',               'Deep night — rest up for tomorrow 🌃'],        // 2
    ['이 시간에도 깨어 계시는군요 💙',               'Still awake at this hour? 💙'],                // 3
    ['목요일 새벽빛이 물들어요 🌌',                   'Thursday dawn is near 🌌'],                    // 4
    ['목요일 이른 새벽이에요 🌄',                     'Early Thursday morning 🌄'],                   // 5
    ['목요일 아침이 밝았어요 🌅',                     'Thursday morning is here 🌅'],                 // 6
    ['목요일 아침, 주말이 슬슬 보여요 🌤️',           'Thursday — weekend in sight 🌤️'],             // 7
    ['목요일 아침이에요 ☀️',                          'Thursday morning ☀️'],                         // 8
    ['목요일 오전이에요 🎯',                          'Thursday morning 🎯'],                         // 9
    ['목요일 오전, 집중해봐요 💡',                    'Thursday — focus time 💡'],                    // 10
    ['목요일 오전이 끝나가요 🕚',                     'Thursday morning wrapping up 🕚'],             // 11
    ['목요일 점심이에요 🍱',                          'Thursday lunch 🍱'],                           // 12
    ['목요일 점심 후예요 😋',                         'Thursday afternoon begins 😋'],                // 13
    ['내일이면 금요일이에요! 조금만 더 💪',            'Friday is tomorrow — one more push 💪'],       // 14
    ['목요일 오후, 내일이면 금요일이에요 ☕',           'Thursday afternoon — Friday is almost here ☕'], // 15
    ['목요일 오후, 내일이 기대되지 않아요? 🎉',       'Thursday afternoon — Friday tomorrow! 🎉'],    // 16
    ['목요일 퇴근 시간이에요 🚶',                     'Thursday clocking out 🚶'],                    // 17
    ['목요일 저녁이에요 🌆',                          'Thursday evening 🌆'],                         // 18
    ['목요일 저녁, 내일 금요일이에요 🎊',             'Thursday night — Friday tomorrow 🎊'],         // 19
    ['내일 금요일이에요, 기대되지 않아요? 🎉',        'Friday tomorrow — excited? 🎉'],               // 20
    ['목요일 밤이에요 🌙',                            'Thursday night 🌙'],                           // 21
    ['내일 금요일이에요, 일찍 주무세요 ⭐',            'Friday tomorrow — rest up ⭐'],                // 22
    ['목요일이 끝나가요 🌚',                          'Thursday almost over 🌚'],                     // 23
  ],

  // ── 금요일 (5) ────────────────────────────────────────────────
  [
    ['드디어 금요일이 시작됐어요! 🎊',               'Friday has finally arrived! 🎊'],              // 0
    ['불금 새벽까지 즐기고 계시군요 🎊',             'Enjoying Friday night into the early hours 🎊'], // 1
    ['신나는 금요일 밤이 깊어가요 🌃',               'Friday night going deep 🌃'],                  // 2
    ['불금 새벽까지 즐기셨군요 🌙',                  'Still going in the early hours 🌙'],            // 3
    ['금요일 새벽빛이 물들어요 🌌',                   'Friday dawn is near 🌌'],                      // 4
    ['드디어 금요일 새벽이에요 🌄',                   'Friday morning — almost here 🌄'],             // 5
    ['드디어 금요일이에요! 🌅',                       'Finally Friday! 🌅'],                          // 6
    ['금요일 아침이에요, 오늘만 버텨요 ☀️',           'Friday morning — one more day ☀️'],           // 7
    ['드디어 금요일이에요! 오늘 하루만 더 🌤️',       'TGIF! Almost at the weekend 🌤️'],             // 8
    ['금요일 오전, 주말 계획 세웠나요? 📅',           'Friday morning — weekend plans set? 📅'],      // 9
    ['금요일 오전이에요 🎯',                          'Friday morning 🎯'],                           // 10
    ['금요일 오전이 끝나가요 🕚',                     'Friday morning wrapping up 🕚'],               // 11
    ['금요일 점심이에요 🍽️',                          'Friday lunch 🍽️'],                            // 12
    ['금요일 점심 후예요, 조금만 더 😊',              'Friday afternoon — almost done 😊'],           // 13
    ['주말이 코앞이에요 🏖️',                          'Weekend is right around the corner 🏖️'],      // 14
    ['주말 계획은 다 세웠나요? 📅',                   'Weekend plans all set? 📅'],                   // 15
    ['퇴근까지 한 시간이에요! 🏁',                    'One hour till the weekend 🏁'],                // 16
    ['이번 주도 수고했어요! 즐거운 주말 되세요 🎉',   'Great work this week! Happy weekend 🎉'],      // 17
    ['불금 저녁이에요! 신나게 즐기세요 🍻',            'Friday night! Go enjoy yourself 🍻'],          // 18
    ['불금 저녁, 어디 가셨어요? 🎊',                 'Friday night out? 🎊'],                        // 19
    ['불금 밤이에요 🌆',                              'Friday night 🌆'],                             // 20
    ['금요일 밤이에요, 주말이 시작됐어요 🎊',          'Friday night — weekend started 🎊'],           // 21
    ['주말이 시작됐어요 🎊',                          'The weekend has started 🎊'],                  // 22
    ['주말의 문이 열렸어요 🎊',                       'The weekend doors are open 🎊'],               // 23
  ],

  // ── 토요일 (6) ────────────────────────────────────────────────
  [
    ['불토가 시작됐어요, 즐기세요! 🎊',              'Saturday night has started — enjoy! 🎊'],      // 0
    ['불토 새벽까지 신나게 즐기고 계시군요 🎊',       'Saturday night going strong into the early hours 🎊'], // 1
    ['신나는 토요일 밤이 깊어가요 🌃',               'Saturday night going deep 🌃'],                // 2
    ['토요일 새벽까지 즐기셨군요 🌙',                'Still going into the early morning 🌙'],        // 3
    ['토요일 새벽빛이 물들어요 🌌',                   'Saturday dawn is near 🌌'],                    // 4
    ['토요일 이른 새벽이에요 🌄',                     'Early Saturday morning 🌄'],                   // 5
    ['토요일 아침이 밝았어요 🌅',                     'Saturday morning is here 🌅'],                 // 6
    ['여유로운 토요일 아침이에요 🌤️',                'Lazy Saturday morning 🌤️'],                   // 7
    ['토요일 아침이에요 ☕',                           'Saturday morning ☕'],                          // 8
    ['토요일 오전, 브런치 어떠세요? 🥞',              'Saturday brunch time? 🥞'],                    // 9
    ['토요일 오전, 어디 나가볼까요? 🌿',              'Saturday morning — head outside? 🌿'],         // 10
    ['토요일 브런치 타임이에요 🍳',                   'Saturday brunch hour 🍳'],                     // 11
    ['토요일 점심이에요 🍽️',                          'Saturday lunch 🍽️'],                          // 12
    ['토요일 점심 후, 낮잠 어떠세요? 😴',            'Post-lunch Saturday nap? 😴'],                 // 13
    ['토요일 오후, 어디 나가셨어요? 😊',              'Out and about on Saturday? 😊'],               // 14
    ['토요일 오후, 여유롭게 보내고 계세요? 🌞',       'Saturday afternoon — taking it easy? 🌞'],     // 15
    ['토요일이 조금씩 저물어가요 🌇',                 'Saturday afternoon slowly winding down 🌇'],   // 16
    ['토요일 저녁 준비 시간이에요 🍳',                'Time to cook Saturday dinner 🍳'],             // 17
    ['토요일 저녁이에요 🌆',                          'Saturday evening 🌆'],                         // 18
    ['토요일 저녁, 즐거운 시간 보내세요 🍽️',         'Saturday evening — enjoy 🍽️'],                // 19
    ['토요일 밤이에요 🌙',                            'Saturday night 🌙'],                           // 20
    ['토요일 밤이에요, 내일도 주말 🎊',               'Saturday night — Sunday tomorrow too 🎊'],     // 21
    ['토요일 밤이 깊어가요 🌙',                       'Late Saturday night 🌙'],                      // 22
    ['토요일이 저물어가요, 내일 일요일이에요 🌚',     'Saturday is ending — Sunday is almost here 🌚'], // 23
  ],
];

export function getGreeting(lang: Lang): string {
  const now = new Date();
  const day = now.getDay();   // 0=일, 6=토
  const h = now.getHours();  // 0~23
  const pair = GREETINGS[day][h];
  return lang === 'ko' ? pair[0] : pair[1];
}
