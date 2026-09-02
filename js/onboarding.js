/* Pre-app onboarding gate: language pick first, then a short quiz, a loading
   screen, and the generated quit plan. Fully localized (the ONB dictionary
   below), so once a language is chosen the whole questionnaire follows it.
   No backend — answers are only stored in localStorage via Store.save().
   Runs once; state.onboarding.completed gates it after that. */
(function (global) {
  const QUIZ_ORDER = ['language', 'name', 'birthdate', 'gender', 'substance', 'subtype', 'cigsPerDay', 'yearsSmoking', 'struggles', 'referral', 'rating'];
  const LANGUAGE_FLAGS = { en: '🇺🇸', he: '🇮🇱', ar: '🇸🇦', es: '🇪🇸', fr: '🇫🇷', ru: '🇷🇺' };
  const RTL_LANGS = ['he', 'ar'];

  const CIGS_PER_DAY = [
    { key: '1-5', t: 'freq_1_5', mid: 3 },
    { key: '6-10', t: 'freq_6_10', mid: 8 },
    { key: '10-20', t: 'freq_10_20', mid: 15 },
    { key: '20+', t: 'freq_20p', mid: 25 }
  ];
  const YEARS_SMOKING = [
    { key: '<1', t: 'years_lt1' }, { key: '1-5', t: 'years_1_5' },
    { key: '5-15', t: 'years_5_15' }, { key: '15+', t: 'years_15p' }
  ];
  const REFERRALS = [
    { key: 'facebook', label: 'Facebook' }, { key: 'tiktok', label: 'TikTok' },
    { key: 'youtube', label: 'YouTube' }, { key: 'friends', t: 'ref_friends' },
    { key: 'x', label: 'X (Twitter)' }, { key: 'instagram', label: 'Instagram' }
  ];
  const STRUGGLES = [
    { key: 'thoughts', t: 's_thoughts' }, { key: 'craving', t: 's_craving' },
    { key: 'social', t: 's_social' }, { key: 'freedom', t: 's_freedom' },
    { key: 'hiding', t: 's_hiding' }, { key: 'discipline', t: 's_discipline' }
  ];

  const ONB = {
    en: {
      continue: 'Continue', lets_start: "Let's start", day: 'Day', month: 'Month', year: 'Year',
      lang_title: 'Which language would you like to use?', lang_sub: 'You can change this later in settings',
      name_title: 'What should we call you?', name_sub: "So we can personalize your experience",
      name_placeholder: 'Your name',
      dob_title: 'When were you born?', dob_sub: 'This helps us tailor your plan to you',
      gender_title: 'Select your gender', male: 'Male', female: 'Female',
      substance_title: 'What do you smoke?',
      substance_opt_cigarettes: 'Cigarettes', substance_opt_cigarettes_sub: 'Regular or roll-your-own tobacco',
      substance_opt_cannabis: 'Cannabis',
      substance_opt_vape: 'Vape', substance_opt_vape_sub: 'E-cigarette, JUUL, IQOS, or similar',
      subtype_cannabis_title: 'How do you usually use it?', subtype_vape_title: 'What device do you use?',
      method_joint: 'Joint', method_bong: 'Bong', method_pipe: 'Pipe', method_edible: 'Edible', method_vape_pen: 'Vape pen', method_other: 'Other',
      device_disposable: 'Disposable device', device_pod: 'Pod (like JUUL)', device_mod: 'Mod', device_heated_tobacco: 'Heated tobacco (like IQOS)', device_refillable: 'Refillable tank', device_other: 'Other',
      brand_title: 'Which cigarette brand do you smoke?',
      cigs_title: 'How many cigarettes do you smoke per day?', cigs_sub: 'Choose the range closest to your daily habit',
      freq_cannabis_title: 'How often do you use per day?', freq_cannabis_sub: 'Choose the range closest to your daily habit',
      freq_vape_title: 'How many times do you vape per day?', freq_vape_sub: 'Choose the range closest to your daily habit',
      freq_1_5: '1-5 {units}', freq_6_10: '6-10 {units}', freq_10_20: '10-20 {units}', freq_20p: '20+ {units}',
      years_title: 'How long have you been smoking?', years_sub: 'This helps us gauge your health risk',
      years_lt1: 'Less than a year', years_1_5: '1-5 years', years_5_15: '5-15 years', years_15p: 'More than 15 years',
      ref_title: 'Where did you hear about us?', ref_friends: 'Friends or family',
      struggle_title: "What's bothering you most about this?", struggle_sub: 'Choose up to 2 options',
      s_thoughts: 'Stop thinking about {units} all the time', s_craving: 'Fewer daily cravings',
      s_social: 'Go out without the pressure', s_freedom: 'Be free from the addiction',
      s_hiding: 'Stop hiding it from people', s_discipline: 'Build self-discipline',
      rate_text: 'Thousands of people have already cut down and quit smoking with our program. Your rating helps more people find us.',
      rate_pop_title: 'Enjoying Quitly?', rate_pop_sub: 'Tap a star to rate it on the App Store', rate_not_now: 'Not Now', rate_rate: 'Rate',
      loading_title: "We're preparing everything for you", loading_sub: 'Just a moment and your personal plan will be ready',
      load_1: 'Analyzing your answers', load_2: 'Building your personalized quit plan', load_3: 'Calculating your timeline',
      plan_days: 'days', plan_duration: 'Plan duration', plan_30days: '30 days', plan_6months: '6 months', plan_12months: '12 months', plan_daily: 'Daily amount',
      plan_daily_value: '{n} → 0 {units}', plan_savings: 'Estimated savings', plan_time: "Time you'll get back", plan_hours: '{n} hours',
      risk_label: 'Health impact if you keep smoking',
      risk_low: 'Low', risk_moderate: 'Moderate', risk_high: 'High', risk_veryhigh: 'Very High',
      risk_msg_low: 'Your body is still resilient — quitting now prevents almost all long-term damage.',
      risk_msg_moderate: 'Smoking is starting to add up. Quitting now lets your body recover strongly.',
      risk_msg_high: 'Years of smoking are straining your body — but quitting now still brings major recovery.',
      risk_msg_veryhigh: 'Every smoke-free day counts now. Quitting has a powerful impact on your health.',
      h_thoughts: 'Your plan to quiet the constant cravings', h_craving: 'Your plan to break the daily craving cycle',
      h_social: 'Your plan to enjoy going out — smoke-free', h_freedom: 'Your path to freedom from smoking',
      h_hiding: 'Your plan to quit — out in the open', h_discipline: 'Your plan to build unshakable self-discipline',
      h_default: 'Congrats! Your personalized plan is ready',
      tips_title: "How you'll get there:",
      tip_thoughts: 'Practice 60 seconds of breathing whenever a craving thought pops up — it dulls the urge fast',
      tip_craving: 'Drink a glass of water and let the craving wave pass — it fades after 3-5 minutes',
      tip_social: 'Prepare a short line like "I\'m quitting" so you don\'t give in out of politeness',
      tip_freedom: 'Mark every smoke-free day on a calendar — a visual streak boosts motivation',
      tip_hiding: 'Sharing the process with one close person lowers stress and boosts commitment',
      tip_discipline: "Set a short alternative ritual (stretch, walk) for moments you'd normally light up",
      tip_default1: 'Daily tracking in the app is your strongest tool — every log builds awareness',
      tip_default2: 'A gradual reduction succeeds far more often than quitting cold turkey'
    },
    he: {
      continue: 'המשך', lets_start: 'בוא נתחיל', day: 'יום', month: 'חודש', year: 'שנה',
      lang_title: 'באיזו שפה תרצה להשתמש?', lang_sub: 'תוכל לשנות זאת מאוחר יותר בהגדרות',
      name_title: 'הזן את שמך', name_sub: 'זה עוזר לנו להתאים אישית את החוויה שלך',
      name_placeholder: 'השם שלך',
      dob_title: 'מתי נולדת?', dob_sub: 'זה עוזר לנו להתאים לך את התוכנית',
      gender_title: 'בחר את המין שלך', male: 'זכר', female: 'נקבה',
      substance_title: 'מה אתה מעשן?',
      substance_opt_cigarettes: 'סיגריות', substance_opt_cigarettes_sub: 'סיגריות רגילות או טבק לגלגול',
      substance_opt_cannabis: 'קנביס',
      substance_opt_vape: 'סיגריה אלקטרונית (וייפ)', substance_opt_vape_sub: 'JUUL, IQOS או דומה',
      subtype_cannabis_title: 'איך אתה בדרך כלל צורך?', subtype_vape_title: 'באיזה מכשיר אתה משתמש?',
      method_joint: 'ג׳וינט', method_bong: 'בונג', method_pipe: 'מקטרת', method_edible: 'אכיל', method_vape_pen: 'עט אידוי', method_other: 'אחר',
      device_disposable: 'מכשיר חד-פעמי', device_pod: 'פוד (כמו JUUL)', device_mod: 'מוד', device_heated_tobacco: 'חימום טבק (כמו IQOS)', device_refillable: 'מיכל למילוי', device_other: 'אחר',
      brand_title: 'איזה מותג סיגריות אתה מעשן?',
      cigs_title: 'כמה סיגריות אתה מעשן ביום?', cigs_sub: 'בחר את הטווח הקרוב ביותר להרגל היומי שלך',
      freq_cannabis_title: 'כמה פעמים אתה צורך ביום?', freq_cannabis_sub: 'בחר את הטווח הקרוב ביותר להרגל היומי שלך',
      freq_vape_title: 'כמה פעמים אתה מעשן וייפ ביום?', freq_vape_sub: 'בחר את הטווח הקרוב ביותר להרגל היומי שלך',
      freq_1_5: '1-5 {units}', freq_6_10: '6-10 {units}', freq_10_20: '10-20 {units}', freq_20p: '20+ {units}',
      years_title: 'כמה זמן אתה מעשן?', years_sub: 'זה עוזר לנו להעריך את הסיכון הבריאותי שלך',
      years_lt1: 'פחות משנה', years_1_5: '1-5 שנים', years_5_15: '5-15 שנים', years_15p: 'יותר מ-15 שנה',
      ref_title: 'מאיפה שמעת עלינו?', ref_friends: 'חברים או משפחה',
      struggle_title: 'מה הכי מפריע לך בזה?', struggle_sub: 'בחר עד 2 אפשרויות',
      s_thoughts: 'להפסיק לחשוב על {units} כל הזמן', s_craving: 'פחות התקפי חשק יומיים',
      s_social: 'לצאת בלי הלחץ', s_freedom: 'להיות חופשי מההתמכרות',
      s_hiding: 'להפסיק להסתיר את זה מאנשים', s_discipline: 'לבנות משמעת עצמית',
      rate_text: 'אלפי אנשים כבר הפחיתו והפסיקו לעשן עם התוכנית שלנו. הדירוג שלך עוזר לעוד אנשים למצוא אותנו.',
      rate_pop_title: 'נהנה מ-Quitly?', rate_pop_sub: 'הקש על כוכב כדי לדרג באפ סטור', rate_not_now: 'לא עכשיו', rate_rate: 'דרג',
      loading_title: 'אנחנו מכינים לך הכל', loading_sub: 'עוד רגע והתוכנית האישית שלך תהיה מוכנה',
      load_1: 'מנתחים את התשובות שלך', load_2: 'בונים לך תוכנית גמילה אישית', load_3: 'מחשבים את לוח הזמנים שלך',
      plan_days: 'ימים', plan_duration: 'משך התוכנית', plan_30days: '30 ימים', plan_6months: '6 חודשים', plan_12months: '12 חודשים', plan_daily: 'כמות יומית',
      plan_daily_value: '{n} ← 0 {units}', plan_savings: 'חיסכון משוער', plan_time: 'זמן שתחזיר לעצמך', plan_hours: '{n} שעות',
      risk_label: 'השפעה בריאותית אם תמשיך לעשן',
      risk_low: 'נמוך', risk_moderate: 'בינוני', risk_high: 'גבוה', risk_veryhigh: 'גבוה מאוד',
      risk_msg_low: 'הגוף שלך עדיין חסין — גמילה עכשיו מונעת כמעט את כל הנזק ארוך-הטווח.',
      risk_msg_moderate: 'העישון מתחיל להצטבר. גמילה עכשיו מאפשרת לגוף שלך להתאושש חזק.',
      risk_msg_high: 'שנים של עישון מעמיסות על הגוף — אבל גמילה עכשיו עדיין מביאה התאוששות משמעותית.',
      risk_msg_veryhigh: 'כל יום ללא עישון קריטי עכשיו. הגמילה משפיעה עוצמתית על הבריאות שלך.',
      h_thoughts: 'התוכנית שלך להשקיט את החשק המתמיד', h_craving: 'התוכנית שלך לשבור את מעגל החשק היומי',
      h_social: 'התוכנית שלך ליהנות מיציאות — בלי עישון', h_freedom: 'הדרך שלך לחופש מעישון',
      h_hiding: 'התוכנית שלך להיגמל — בגלוי', h_discipline: 'התוכנית שלך לבנות משמעת עצמית איתנה',
      h_default: 'ברכות! התוכנית האישית שלך מוכנה',
      tips_title: 'איך תגיע לשם:',
      tip_thoughts: 'תרגל 60 שניות של נשימה בכל פעם שעולה מחשבה על סיגריה — זה מקהה את הדחף מהר',
      tip_craving: 'שתה כוס מים ותן לגל החשק לעבור — הוא נחלש אחרי 3-5 דקות',
      tip_social: 'הכן מראש משפט קצר כמו "אני בגמילה" כדי לא להתפתות מנימוס',
      tip_freedom: 'סמן כל יום ללא עישון בלוח — רצף ויזואלי מגביר מוטיבציה',
      tip_hiding: 'שיתוף התהליך עם אדם קרוב אחד מוריד לחץ ומגביר מחויבות',
      tip_discipline: 'קבע טקס חלופי קצר (מתיחה, הליכה) לרגעים שבהם היית מדליק',
      tip_default1: 'המעקב היומי באפליקציה הוא הכלי החזק שלך — כל תיעוד בונה מודעות',
      tip_default2: 'הפחתה הדרגתית מצליחה הרבה יותר מהפסקה חדה בבת אחת'
    },
    ar: {
      continue: 'متابعة', lets_start: 'لنبدأ', day: 'يوم', month: 'شهر', year: 'سنة',
      lang_title: 'ما اللغة التي تريد استخدامها؟', lang_sub: 'يمكنك تغييرها لاحقاً من الإعدادات',
      name_title: 'كيف نناديك؟', name_sub: 'هذا يساعدنا على تخصيص تجربتك',
      name_placeholder: 'اسمك',
      dob_title: 'متى وُلدت؟', dob_sub: 'يساعدنا هذا على تخصيص خطتك',
      gender_title: 'اختر جنسك', male: 'ذكر', female: 'أنثى',
      substance_title: 'ما الذي تدخنه؟',
      substance_opt_cigarettes: 'سجائر', substance_opt_cigarettes_sub: 'سجائر عادية أو تبغ لف يدوي',
      substance_opt_cannabis: 'القنّب',
      substance_opt_vape: 'سيجارة إلكترونية', substance_opt_vape_sub: 'JUUL أو IQOS أو ما شابه',
      subtype_cannabis_title: 'كيف تستخدمه عادةً؟', subtype_vape_title: 'ما الجهاز الذي تستخدمه؟',
      method_joint: 'لفافة', method_bong: 'بونغ', method_pipe: 'غليون', method_edible: 'مأكول', method_vape_pen: 'قلم تبخير', method_other: 'أخرى',
      device_disposable: 'جهاز يُستعمل مرة واحدة', device_pod: 'كبسولة (مثل JUUL)', device_mod: 'مود', device_heated_tobacco: 'تبغ مُسخَّن (مثل IQOS)', device_refillable: 'خزان قابل لإعادة التعبئة', device_other: 'أخرى',
      brand_title: 'ما ماركة السجائر التي تدخنها؟',
      cigs_title: 'كم سيجارة تدخن يومياً؟', cigs_sub: 'اختر النطاق الأقرب لعادتك اليومية',
      freq_cannabis_title: 'كم مرة تستخدمه يومياً؟', freq_cannabis_sub: 'اختر النطاق الأقرب لعادتك اليومية',
      freq_vape_title: 'كم مرة تستخدم السيجارة الإلكترونية يومياً؟', freq_vape_sub: 'اختر النطاق الأقرب لعادتك اليومية',
      freq_1_5: '1-5 {units}', freq_6_10: '6-10 {units}', freq_10_20: '10-20 {units}', freq_20p: '20+ {units}',
      years_title: 'منذ متى وأنت تدخن؟', years_sub: 'يساعدنا هذا على تقدير خطرك الصحي',
      years_lt1: 'أقل من سنة', years_1_5: '1-5 سنوات', years_5_15: '5-15 سنة', years_15p: 'أكثر من 15 سنة',
      ref_title: 'كيف سمعت عنا؟', ref_friends: 'أصدقاء أو عائلة',
      struggle_title: 'ما الذي يزعجك أكثر في هذا؟', struggle_sub: 'اختر خيارين كحد أقصى',
      s_thoughts: 'التوقف عن التفكير في {units} طوال الوقت', s_craving: 'رغبة يومية أقل',
      s_social: 'الخروج دون ضغط', s_freedom: 'التحرر من الإدمان',
      s_hiding: 'التوقف عن إخفائه عن الناس', s_discipline: 'بناء انضباط ذاتي',
      rate_text: 'آلاف الأشخاص قللوا وأقلعوا عن التدخين مع برنامجنا. تقييمك يساعد آخرين على إيجادنا.',
      rate_pop_title: 'أعجبك Quitly؟', rate_pop_sub: 'اضغط نجمة لتقييمه في المتجر', rate_not_now: 'ليس الآن', rate_rate: 'قيّم',
      loading_title: 'نجهّز لك كل شيء', loading_sub: 'لحظة وستكون خطتك الشخصية جاهزة',
      load_1: 'نحلّل إجاباتك', load_2: 'نبني خطة إقلاع مخصصة لك', load_3: 'نحسب جدولك الزمني',
      plan_days: 'أيام', plan_duration: 'مدة الخطة', plan_30days: '30 يوماً', plan_6months: '6 أشهر', plan_12months: '12 شهراً', plan_daily: 'الكمية اليومية',
      plan_daily_value: '{n} ← 0 {units}', plan_savings: 'التوفير المقدّر', plan_time: 'وقت تستعيده', plan_hours: '{n} ساعة',
      risk_label: 'التأثير الصحي إذا واصلت التدخين',
      risk_low: 'منخفض', risk_moderate: 'متوسط', risk_high: 'مرتفع', risk_veryhigh: 'مرتفع جداً',
      risk_msg_low: 'جسمك ما زال مرناً — الإقلاع الآن يمنع معظم الضرر بعيد المدى.',
      risk_msg_moderate: 'التدخين بدأ يتراكم. الإقلاع الآن يتيح لجسمك تعافياً قوياً.',
      risk_msg_high: 'سنوات التدخين تُجهد جسمك — لكن الإقلاع الآن يجلب تعافياً كبيراً.',
      risk_msg_veryhigh: 'كل يوم دون تدخين مهم الآن. الإقلاع له أثر قوي على صحتك.',
      h_thoughts: 'خطتك لإسكات الرغبة المستمرة', h_craving: 'خطتك لكسر دورة الرغبة اليومية',
      h_social: 'خطتك للاستمتاع بالخروج — دون تدخين', h_freedom: 'طريقك للتحرر من التدخين',
      h_hiding: 'خطتك للإقلاع — علناً', h_discipline: 'خطتك لبناء انضباط ذاتي راسخ',
      h_default: 'تهانينا! خطتك الشخصية جاهزة',
      tips_title: 'كيف ستصل إلى هناك:',
      tip_thoughts: 'مارس 60 ثانية من التنفس كلما ظهرت فكرة الرغبة — يخفّف الاندفاع بسرعة',
      tip_craving: 'اشرب كوب ماء ودع موجة الرغبة تمر — تتلاشى بعد 3-5 دقائق',
      tip_social: 'جهّز عبارة قصيرة مثل "أنا أقلع" كي لا تستسلم مجاملةً',
      tip_freedom: 'علّم كل يوم دون تدخين على تقويم — التسلسل المرئي يعزز الحافز',
      tip_hiding: 'مشاركة العملية مع شخص قريب تقلل التوتر وتزيد الالتزام',
      tip_discipline: 'حدّد طقساً بديلاً قصيراً (تمدد، مشي) للحظات التي كنت تشعل فيها',
      tip_default1: 'التتبع اليومي في التطبيق أقوى أدواتك — كل تسجيل يبني الوعي',
      tip_default2: 'الإقلاع التدريجي ينجح أكثر بكثير من التوقف المفاجئ'
    },
    es: {
      continue: 'Continuar', lets_start: 'Empecemos', day: 'Día', month: 'Mes', year: 'Año',
      lang_title: '¿Qué idioma quieres usar?', lang_sub: 'Puedes cambiarlo luego en ajustes',
      name_title: '¿Cómo te llamamos?', name_sub: 'Así podemos personalizar tu experiencia',
      name_placeholder: 'Tu nombre',
      dob_title: '¿Cuándo naciste?', dob_sub: 'Nos ayuda a personalizar tu plan',
      gender_title: 'Selecciona tu género', male: 'Hombre', female: 'Mujer',
      substance_title: '¿Qué fumas?',
      substance_opt_cigarettes: 'Cigarrillos', substance_opt_cigarettes_sub: 'Cigarrillos normales o tabaco de liar',
      substance_opt_cannabis: 'Cannabis',
      substance_opt_vape: 'Vapeador', substance_opt_vape_sub: 'Cigarrillo electrónico, JUUL, IQOS o similar',
      subtype_cannabis_title: '¿Cómo lo consumes normalmente?', subtype_vape_title: '¿Qué dispositivo usas?',
      method_joint: 'Porro', method_bong: 'Bong', method_pipe: 'Pipa', method_edible: 'Comestible', method_vape_pen: 'Vaporizador', method_other: 'Otro',
      device_disposable: 'Dispositivo desechable', device_pod: 'Pod (como JUUL)', device_mod: 'Mod', device_heated_tobacco: 'Tabaco calentado (como IQOS)', device_refillable: 'Depósito recargable', device_other: 'Otro',
      brand_title: '¿Qué marca de cigarrillos fumas?',
      cigs_title: '¿Cuántos cigarrillos fumas al día?', cigs_sub: 'Elige el rango más cercano a tu hábito diario',
      freq_cannabis_title: '¿Cuántas veces consumes al día?', freq_cannabis_sub: 'Elige el rango más cercano a tu hábito diario',
      freq_vape_title: '¿Cuántas veces vapeas al día?', freq_vape_sub: 'Elige el rango más cercano a tu hábito diario',
      freq_1_5: '1-5 {units}', freq_6_10: '6-10 {units}', freq_10_20: '10-20 {units}', freq_20p: '20+ {units}',
      years_title: '¿Cuánto tiempo llevas fumando?', years_sub: 'Nos ayuda a estimar tu riesgo de salud',
      years_lt1: 'Menos de un año', years_1_5: '1-5 años', years_5_15: '5-15 años', years_15p: 'Más de 15 años',
      ref_title: '¿Cómo supiste de nosotros?', ref_friends: 'Amigos o familia',
      struggle_title: '¿Qué es lo que más te molesta de esto?', struggle_sub: 'Elige hasta 2 opciones',
      s_thoughts: 'Dejar de pensar en {units} todo el tiempo', s_craving: 'Menos antojos diarios',
      s_social: 'Salir sin la presión', s_freedom: 'Ser libre de la adicción',
      s_hiding: 'Dejar de esconderlo de la gente', s_discipline: 'Desarrollar autodisciplina',
      rate_text: 'Miles de personas ya redujeron y dejaron de fumar con nuestro programa. Tu valoración ayuda a que más personas nos encuentren.',
      rate_pop_title: '¿Te gusta Quitly?', rate_pop_sub: 'Toca una estrella para valorarlo en la tienda', rate_not_now: 'Ahora no', rate_rate: 'Valorar',
      loading_title: 'Estamos preparando todo para ti', loading_sub: 'Un momento y tu plan personal estará listo',
      load_1: 'Analizando tus respuestas', load_2: 'Creando tu plan personalizado', load_3: 'Calculando tu cronograma',
      plan_days: 'días', plan_duration: 'Duración del plan', plan_30days: '30 días', plan_6months: '6 meses', plan_12months: '12 meses', plan_daily: 'Cantidad diaria',
      plan_daily_value: '{n} → 0 {units}', plan_savings: 'Ahorro estimado', plan_time: 'Tiempo que recuperas', plan_hours: '{n} horas',
      risk_label: 'Impacto en la salud si sigues fumando',
      risk_low: 'Bajo', risk_moderate: 'Moderado', risk_high: 'Alto', risk_veryhigh: 'Muy alto',
      risk_msg_low: 'Tu cuerpo aún es resistente — dejarlo ahora evita casi todo el daño a largo plazo.',
      risk_msg_moderate: 'Fumar empieza a acumularse. Dejarlo ahora permite una fuerte recuperación.',
      risk_msg_high: 'Años de fumar exigen a tu cuerpo — pero dejarlo ahora aún trae gran recuperación.',
      risk_msg_veryhigh: 'Cada día sin fumar cuenta ahora. Dejarlo tiene un impacto poderoso en tu salud.',
      h_thoughts: 'Tu plan para calmar los antojos constantes', h_craving: 'Tu plan para romper el ciclo diario de antojos',
      h_social: 'Tu plan para disfrutar al salir — sin fumar', h_freedom: 'Tu camino a la libertad del tabaco',
      h_hiding: 'Tu plan para dejarlo — a la vista', h_discipline: 'Tu plan para una autodisciplina firme',
      h_default: '¡Felicidades! Tu plan personalizado está listo',
      tips_title: 'Cómo lo lograrás:',
      tip_thoughts: 'Practica 60 segundos de respiración cuando surja un antojo — reduce el impulso rápido',
      tip_craving: 'Bebe un vaso de agua y deja pasar la ola — se desvanece tras 3-5 minutos',
      tip_social: 'Prepara una frase como "estoy dejándolo" para no caer por cortesía',
      tip_freedom: 'Marca cada día sin fumar en un calendario — la racha motiva',
      tip_hiding: 'Compartir el proceso con alguien cercano baja el estrés y sube el compromiso',
      tip_discipline: 'Ten un ritual alternativo corto (estirar, caminar) para esos momentos',
      tip_default1: 'El seguimiento diario es tu mejor herramienta — cada registro crea conciencia',
      tip_default2: 'Reducir gradualmente funciona mucho más que dejarlo de golpe'
    },
    fr: {
      continue: 'Continuer', lets_start: 'C\'est parti', day: 'Jour', month: 'Mois', year: 'Année',
      lang_title: 'Quelle langue veux-tu utiliser ?', lang_sub: 'Tu pourras la changer plus tard dans les réglages',
      name_title: 'Comment devons-nous t\'appeler ?', name_sub: 'Cela nous aide à personnaliser ton expérience',
      name_placeholder: 'Ton prénom',
      dob_title: 'Quand es-tu né ?', dob_sub: 'Cela nous aide à personnaliser ton plan',
      gender_title: 'Sélectionne ton genre', male: 'Homme', female: 'Femme',
      substance_title: 'Que fumes-tu ?',
      substance_opt_cigarettes: 'Cigarettes', substance_opt_cigarettes_sub: 'Cigarettes classiques ou tabac à rouler',
      substance_opt_cannabis: 'Cannabis',
      substance_opt_vape: 'Cigarette électronique', substance_opt_vape_sub: 'JUUL, IQOS ou similaire',
      subtype_cannabis_title: 'Comment le consommes-tu habituellement ?', subtype_vape_title: 'Quel appareil utilises-tu ?',
      method_joint: 'Joint', method_bong: 'Bang', method_pipe: 'Pipe', method_edible: 'Comestible', method_vape_pen: 'Stylo vapoteur', method_other: 'Autre',
      device_disposable: 'Appareil jetable', device_pod: 'Pod (type JUUL)', device_mod: 'Mod', device_heated_tobacco: 'Tabac chauffé (type IQOS)', device_refillable: 'Réservoir rechargeable', device_other: 'Autre',
      brand_title: 'Quelle marque de cigarettes fumes-tu ?',
      cigs_title: 'Combien de cigarettes fumes-tu par jour ?', cigs_sub: 'Choisis la tranche la plus proche de ton habitude',
      freq_cannabis_title: 'Combien de fois par jour en consommes-tu ?', freq_cannabis_sub: 'Choisis la tranche la plus proche de ton habitude',
      freq_vape_title: 'Combien de fois vapotes-tu par jour ?', freq_vape_sub: 'Choisis la tranche la plus proche de ton habitude',
      freq_1_5: '1-5 {units}', freq_6_10: '6-10 {units}', freq_10_20: '10-20 {units}', freq_20p: '20+ {units}',
      years_title: 'Depuis combien de temps fumes-tu ?', years_sub: 'Cela nous aide à évaluer ton risque santé',
      years_lt1: 'Moins d\'un an', years_1_5: '1-5 ans', years_5_15: '5-15 ans', years_15p: 'Plus de 15 ans',
      ref_title: 'Comment as-tu entendu parler de nous ?', ref_friends: 'Amis ou famille',
      struggle_title: 'Qu\'est-ce qui te dérange le plus ?', struggle_sub: 'Choisis jusqu\'à 2 options',
      s_thoughts: 'Arrêter de penser aux {units} en permanence', s_craving: 'Moins d\'envies quotidiennes',
      s_social: 'Sortir sans la pression', s_freedom: 'Être libéré de la dépendance',
      s_hiding: 'Arrêter de le cacher aux autres', s_discipline: 'Développer l\'autodiscipline',
      rate_text: 'Des milliers de personnes ont déjà réduit et arrêté avec notre programme. Ta note aide d\'autres à nous trouver.',
      rate_pop_title: 'Tu aimes Quitly ?', rate_pop_sub: 'Touche une étoile pour noter sur le store', rate_not_now: 'Plus tard', rate_rate: 'Noter',
      loading_title: 'Nous préparons tout pour toi', loading_sub: 'Un instant et ton plan personnel sera prêt',
      load_1: 'Analyse de tes réponses', load_2: 'Création de ton plan personnalisé', load_3: 'Calcul de ton calendrier',
      plan_days: 'jours', plan_duration: 'Durée du plan', plan_30days: '30 jours', plan_6months: '6 mois', plan_12months: '12 mois', plan_daily: 'Quantité quotidienne',
      plan_daily_value: '{n} → 0 {units}', plan_savings: 'Économies estimées', plan_time: 'Temps regagné', plan_hours: '{n} heures',
      risk_label: 'Impact santé si tu continues à fumer',
      risk_low: 'Faible', risk_moderate: 'Modéré', risk_high: 'Élevé', risk_veryhigh: 'Très élevé',
      risk_msg_low: 'Ton corps est encore résistant — arrêter maintenant évite presque tous les dégâts à long terme.',
      risk_msg_moderate: 'Le tabac commence à s\'accumuler. Arrêter maintenant permet une forte récupération.',
      risk_msg_high: 'Des années de tabac sollicitent ton corps — mais arrêter maintenant apporte une vraie récupération.',
      risk_msg_veryhigh: 'Chaque jour sans tabac compte désormais. Arrêter a un impact puissant sur ta santé.',
      h_thoughts: 'Ton plan pour apaiser les envies constantes', h_craving: 'Ton plan pour briser le cycle quotidien des envies',
      h_social: 'Ton plan pour profiter des sorties — sans tabac', h_freedom: 'Ton chemin vers la liberté sans tabac',
      h_hiding: 'Ton plan pour arrêter — au grand jour', h_discipline: 'Ton plan pour une autodiscipline solide',
      h_default: 'Félicitations ! Ton plan personnalisé est prêt',
      tips_title: 'Comment y arriver :',
      tip_thoughts: 'Fais 60 secondes de respiration dès qu\'une envie surgit — ça calme vite l\'impulsion',
      tip_craving: 'Bois un verre d\'eau et laisse passer la vague — elle s\'estompe après 3-5 minutes',
      tip_social: 'Prépare une phrase comme « j\'arrête » pour ne pas céder par politesse',
      tip_freedom: 'Marque chaque jour sans tabac sur un calendrier — la série motive',
      tip_hiding: 'Partager le processus avec un proche réduit le stress et renforce l\'engagement',
      tip_discipline: 'Prévois un rituel court (étirement, marche) pour ces moments-là',
      tip_default1: 'Le suivi quotidien est ton meilleur outil — chaque saisie crée de la conscience',
      tip_default2: 'Réduire progressivement réussit bien plus que l\'arrêt brutal'
    },
    ru: {
      continue: 'Далее', lets_start: 'Начнём', day: 'День', month: 'Месяц', year: 'Год',
      lang_title: 'Какой язык вы хотите использовать?', lang_sub: 'Позже можно изменить в настройках',
      name_title: 'Как к вам обращаться?', name_sub: 'Это поможет персонализировать ваш опыт',
      name_placeholder: 'Ваше имя',
      dob_title: 'Когда вы родились?', dob_sub: 'Это помогает подстроить план под вас',
      gender_title: 'Выберите пол', male: 'Мужчина', female: 'Женщина',
      substance_title: 'Что вы курите?',
      substance_opt_cigarettes: 'Сигареты', substance_opt_cigarettes_sub: 'Обычные сигареты или самокрутки',
      substance_opt_cannabis: 'Каннабис',
      substance_opt_vape: 'Электронная сигарета', substance_opt_vape_sub: 'JUUL, IQOS и подобные',
      subtype_cannabis_title: 'Как вы обычно его употребляете?', subtype_vape_title: 'Какое устройство вы используете?',
      method_joint: 'Косяк', method_bong: 'Бонг', method_pipe: 'Трубка', method_edible: 'Съедобный продукт', method_vape_pen: 'Вейп-ручка', method_other: 'Другое',
      device_disposable: 'Одноразовое устройство', device_pod: 'Под-система (как JUUL)', device_mod: 'Мод', device_heated_tobacco: 'Нагреваемый табак (как IQOS)', device_refillable: 'Бак с дозаправкой', device_other: 'Другое',
      brand_title: 'Какую марку сигарет вы курите?',
      cigs_title: 'Сколько сигарет вы курите в день?', cigs_sub: 'Выберите диапазон, ближайший к вашей привычке',
      freq_cannabis_title: 'Сколько раз в день вы употребляете?', freq_cannabis_sub: 'Выберите диапазон, ближайший к вашей привычке',
      freq_vape_title: 'Сколько раз в день вы парите?', freq_vape_sub: 'Выберите диапазон, ближайший к вашей привычке',
      freq_1_5: '1-5 {units}', freq_6_10: '6-10 {units}', freq_10_20: '10-20 {units}', freq_20p: '20+ {units}',
      years_title: 'Как давно вы курите?', years_sub: 'Это помогает оценить риск для здоровья',
      years_lt1: 'Меньше года', years_1_5: '1-5 лет', years_5_15: '5-15 лет', years_15p: 'Более 15 лет',
      ref_title: 'Откуда вы о нас узнали?', ref_friends: 'Друзья или семья',
      struggle_title: 'Что беспокоит вас больше всего?', struggle_sub: 'Выберите до 2 вариантов',
      s_thoughts: 'Перестать постоянно думать о {units}', s_craving: 'Меньше ежедневной тяги',
      s_social: 'Выходить без давления', s_freedom: 'Освободиться от зависимости',
      s_hiding: 'Перестать скрывать это от людей', s_discipline: 'Развить самодисциплину',
      rate_text: 'Тысячи людей уже сократили и бросили курить с нашей программой. Ваша оценка помогает другим найти нас.',
      rate_pop_title: 'Нравится Quitly?', rate_pop_sub: 'Нажмите звезду, чтобы оценить в магазине', rate_not_now: 'Не сейчас', rate_rate: 'Оценить',
      loading_title: 'Мы всё для вас готовим', loading_sub: 'Ещё мгновение — и ваш план будет готов',
      load_1: 'Анализируем ваши ответы', load_2: 'Строим ваш персональный план', load_3: 'Рассчитываем ваш график',
      plan_days: 'дней', plan_duration: 'Длительность плана', plan_30days: '30 дней', plan_6months: '6 месяцев', plan_12months: '12 месяцев', plan_daily: 'Дневная норма',
      plan_daily_value: '{n} → 0 {units}', plan_savings: 'Примерная экономия', plan_time: 'Возвращённое время', plan_hours: '{n} часов',
      risk_label: 'Влияние на здоровье, если продолжить курить',
      risk_low: 'Низкий', risk_moderate: 'Умеренный', risk_high: 'Высокий', risk_veryhigh: 'Очень высокий',
      risk_msg_low: 'Ваш организм ещё вынослив — отказ сейчас предотвращает почти весь долгосрочный вред.',
      risk_msg_moderate: 'Курение начинает накапливаться. Отказ сейчас даёт организму сильно восстановиться.',
      risk_msg_high: 'Годы курения нагружают организм — но отказ сейчас всё ещё приносит серьёзное восстановление.',
      risk_msg_veryhigh: 'Каждый день без курения важен сейчас. Отказ мощно влияет на ваше здоровье.',
      h_thoughts: 'Ваш план усмирить постоянную тягу', h_craving: 'Ваш план разорвать ежедневный цикл тяги',
      h_social: 'Ваш план наслаждаться выходами — без курения', h_freedom: 'Ваш путь к свободе от курения',
      h_hiding: 'Ваш план бросить — открыто', h_discipline: 'Ваш план построить крепкую самодисциплину',
      h_default: 'Поздравляем! Ваш персональный план готов',
      tips_title: 'Как вы этого добьётесь:',
      tip_thoughts: 'Практикуйте 60 секунд дыхания при мысли о сигарете — это быстро притупляет тягу',
      tip_craving: 'Выпейте стакан воды и дайте волне пройти — она слабеет через 3-5 минут',
      tip_social: 'Подготовьте короткую фразу «я бросаю», чтобы не поддаться из вежливости',
      tip_freedom: 'Отмечайте каждый день без курения в календаре — серия мотивирует',
      tip_hiding: 'Рассказать о процессе близкому человеку снижает стресс и повышает ответственность',
      tip_discipline: 'Придумайте короткий ритуал (растяжка, прогулка) для таких моментов',
      tip_default1: 'Ежедневный трекинг — ваш сильнейший инструмент, каждая запись строит осознанность',
      tip_default2: 'Постепенное снижение удаётся гораздо чаще, чем резкий отказ'
    }
  };

  const RISK_KEYS = ['low', 'moderate', 'high', 'veryhigh'];
  const RISK_CLASS = { low: 'low', moderate: 'moderate', high: 'high', veryhigh: 'very-high' };

  function ageFromYear(birthYear) {
    const y = parseInt(birthYear, 10);
    return y ? Math.max(0, new Date().getFullYear() - y) : null;
  }
  function healthRiskKey(age, cigScore, yearsScore) {
    const ageScore = age == null ? 1 : age < 30 ? 0 : age < 45 ? 1 : age < 60 ? 2 : 3;
    const total = ageScore + cigScore + yearsScore;
    const idx = total <= 2 ? 0 : total <= 4 ? 1 : total <= 6 ? 2 : 3;
    return RISK_KEYS[idx];
  }

  function start(state, onComplete) {
    if (!state.onboarding) {
      state.onboarding = {
        completed: false, name: null, birthDay: null, birthMonth: null, birthYear: null,
        gender: null, substance: null, subtype: null, cigsPerDay: null, yearsSmoking: null, referral: null, struggles: [], language: null, rated: false
      };
    }

    const panel = document.getElementById('onbPanel');
    const overlay = document.getElementById('onboardingOverlay');
    let step = 'language';
    let lang = state.onboarding.language || (global.I18N && I18N.getLang && I18N.getLang()) || 'en';
    let loadingTimer = null;

    function esc(s) { return global.Charts ? global.Charts.esc(s) : String(s); }
    function T(key, vars) {
      let s = (ONB[lang] && ONB[lang][key]) || ONB.en[key] || key;
      if (vars) Object.keys(vars).forEach(k => { s = s.split('{' + k + '}').join(vars[k]); });
      return s;
    }
    function applyDir() {
      overlay.setAttribute('dir', RTL_LANGS.includes(lang) ? 'rtl' : 'ltr');
    }
    function optLabel(o) {
      if (!o.t) return o.label;
      const substance = state.onboarding.substance || Substances.DEFAULT;
      return T(o.t, { unit: Substances.unit(substance, lang, 1), units: Substances.unit(substance, lang, 2) });
    }
    function freqLabel(c) {
      const substance = state.onboarding.substance || Substances.DEFAULT;
      return T(c.t, { units: Substances.unit(substance, lang, 2) });
    }

    function quizTopbar(disableBack) {
      const idx = QUIZ_ORDER.indexOf(step);
      const pct = idx >= 0 ? Math.round(((idx + 1) / QUIZ_ORDER.length) * 100) : 0;
      return `
        <div class="quiz-topbar">
          <button type="button" class="quiz-back" data-action="back" ${disableBack ? 'disabled' : ''}>‹</button>
          <div class="quiz-progress-track"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
        </div>
      `;
    }

    function renderOptionsStep(cfg) {
      const first = QUIZ_ORDER.indexOf(step) === 0;
      const multi = !!cfg.multi;
      const selectedKeys = multi ? cfg.selected : null;
      const selectedKey = multi ? null : cfg.selected;
      const valid = multi ? selectedKeys.length > 0 : !!selectedKey;
      const optsHtml = cfg.options.map(o => {
        const isSel = multi ? selectedKeys.includes(o.key) : selectedKey === o.key;
        const isDisabled = multi && !isSel && selectedKeys.length >= (cfg.max || 1);
        return `
          <button type="button" class="quiz-option ${isSel ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}" data-action="select-option" data-value="${esc(o.key)}" ${isDisabled ? 'disabled' : ''}>
            <span class="quiz-option-main">
              ${o.icon ? `<span class="quiz-option-icon icon-tile ${o.iconClass || 'tile-blue'}">${o.icon}</span>` : ''}
              <span class="quiz-option-copy">
                <span class="quiz-option-label">${o.emoji ? `<span class="quiz-emoji">${o.emoji}</span> ` : ''}${esc(o.label)}</span>
                ${o.sub ? `<span class="quiz-option-sub">${esc(o.sub)}</span>` : ''}
              </span>
            </span>
            <span class="quiz-check">✓</span>
          </button>
        `;
      }).join('');
      panel.innerHTML = `
        <div class="quiz-screen">
          ${quizTopbar(first)}
          <div class="quiz-body">
            <h1 class="quiz-title">${esc(cfg.title)}</h1>
            ${cfg.subtitle ? `<p class="quiz-subtitle">${esc(cfg.subtitle)}</p>` : ''}
            <div class="quiz-options">${optsHtml}</div>
          </div>
          <button type="button" class="quiz-cta" data-action="continue" ${valid ? '' : 'disabled'}>${esc(T('continue'))}</button>
        </div>
      `;
    }

    function renderName() {
      const o = state.onboarding;
      const valid = !!(o.name && o.name.trim());
      panel.innerHTML = `
        <div class="quiz-screen">
          ${quizTopbar(false)}
          <div class="quiz-body">
            <h1 class="quiz-title">${esc(T('name_title'))}</h1>
            <p class="quiz-subtitle">${esc(T('name_sub'))}</p>
            <input type="text" class="quiz-name-input" id="qName" maxlength="30" autocomplete="given-name"
                   placeholder="${esc(T('name_placeholder'))}" value="${esc(o.name || '')}">
          </div>
          <button type="button" class="quiz-cta" data-action="continue" ${valid ? '' : 'disabled'}>${esc(T('continue'))}</button>
        </div>
      `;
      const input = document.getElementById('qName');
      if (input) setTimeout(() => input.focus(), 50);
    }

    function renderBirthdate() {
      const o = state.onboarding;
      const valid = o.birthDay >= 1 && o.birthDay <= 31 && o.birthMonth >= 1 && o.birthMonth <= 12 &&
        o.birthYear >= 1930 && o.birthYear <= new Date().getFullYear();
      panel.innerHTML = `
        <div class="quiz-screen">
          ${quizTopbar(false)}
          <div class="quiz-body">
            <h1 class="quiz-title">${esc(T('dob_title'))}</h1>
            <p class="quiz-subtitle">${esc(T('dob_sub'))}</p>
            <div class="quiz-dob-row">
              <div class="quiz-dob-field"><label for="dobDay">${esc(T('day'))}</label><input type="number" min="1" max="31" id="dobDay" value="${o.birthDay || ''}" placeholder="DD"></div>
              <div class="quiz-dob-field"><label for="dobMonth">${esc(T('month'))}</label><input type="number" min="1" max="12" id="dobMonth" value="${o.birthMonth || ''}" placeholder="MM"></div>
              <div class="quiz-dob-field"><label for="dobYear">${esc(T('year'))}</label><input type="number" min="1930" max="${new Date().getFullYear()}" id="dobYear" value="${o.birthYear || ''}" placeholder="YYYY"></div>
            </div>
          </div>
          <button type="button" class="quiz-cta" data-action="continue" ${valid ? '' : 'disabled'}>${esc(T('continue'))}</button>
        </div>
      `;
    }

    function renderRating() {
      panel.innerHTML = `
        <div class="quiz-screen">
          ${quizTopbar(false)}
          <div class="quiz-body">
            <div class="rate-hero">
              <div class="rate-heart">${Icons.svg('heart', 46)}</div>
              <div class="rate-stars">★★★★★</div>
              <p class="rate-text">${esc(T('rate_text'))}</p>
            </div>
          </div>
          <button type="button" class="quiz-cta" data-action="rate-continue">${esc(T('continue'))}</button>
        </div>
      `;
    }

    function showRatingPopup() {
      const scrim = document.createElement('div');
      scrim.className = 'rate-popup-scrim';
      scrim.id = 'ratePopupScrim';
      scrim.setAttribute('dir', RTL_LANGS.includes(lang) ? 'rtl' : 'ltr');
      scrim.innerHTML = `
        <div class="rate-popup">
          <p class="rate-popup-title">${esc(T('rate_pop_title'))}</p>
          <p class="rate-popup-sub">${esc(T('rate_pop_sub'))}</p>
          <div class="rate-popup-stars" data-action="popup-star">★★★★★</div>
          <div class="rate-popup-actions">
            <button type="button" data-action="popup-not-now">${esc(T('rate_not_now'))}</button>
            <button type="button" data-action="popup-star">${esc(T('rate_rate'))}</button>
          </div>
        </div>
      `;
      document.body.appendChild(scrim);
    }

    function closeRatingPopup() {
      const scrim = document.getElementById('ratePopupScrim');
      if (scrim) scrim.remove();
    }

    function renderLoading() {
      panel.innerHTML = `
        <div class="loading-screen">
          <div class="loading-percent" id="loadingPercent">0%</div>
          <p class="loading-title">${esc(T('loading_title'))}</p>
          <p class="loading-subtitle">${esc(T('loading_sub'))}</p>
          <div class="loading-checklist">
            <div class="loading-check-row" id="loadingCheck0"><span>${esc(T('load_1'))}</span><span class="loading-check-dot">✓</span></div>
            <div class="loading-check-row" id="loadingCheck1"><span>${esc(T('load_2'))}</span><span class="loading-check-dot">✓</span></div>
            <div class="loading-check-row" id="loadingCheck2"><span>${esc(T('load_3'))}</span><span class="loading-check-dot">✓</span></div>
          </div>
        </div>
      `;
      runLoadingAnimation();
    }

    function runLoadingAnimation() {
      let pct = 0;
      const el = document.getElementById('loadingPercent');
      const rows = [document.getElementById('loadingCheck0'), document.getElementById('loadingCheck1'), document.getElementById('loadingCheck2')];
      loadingTimer = setInterval(() => {
        pct = Math.min(100, pct + 3 + Math.random() * 3);
        const shown = Math.floor(pct);
        if (el) el.textContent = shown + '%';
        if (shown >= 35 && rows[0]) rows[0].classList.add('done');
        if (shown >= 70 && rows[1]) rows[1].classList.add('done');
        if (shown >= 100) {
          if (rows[2]) rows[2].classList.add('done');
          clearInterval(loadingTimer);
          setTimeout(() => goToStep('plan'), 450);
        }
      }, 70);
    }

    function computePlan(spanDays) {
      const days = spanDays || 30;
      const o = state.onboarding;
      const substance = Substances.get(o.substance);
      const bucketIdx = Math.max(0, CIGS_PER_DAY.findIndex(c => c.key === o.cigsPerDay));
      const bucket = CIGS_PER_DAY[bucketIdx];
      const startMid = bucket.mid;
      const avgReduction = startMid / 2;
      const savings = Math.round(avgReduction * substance.pricePerUnit * days);
      const hours = substance.lifeImpactMinutesPerUnit != null ? Math.round((avgReduction * substance.lifeImpactMinutesPerUnit * days) / 60) : null;
      const tipKeys = (o.struggles || []).slice(0, 2);
      const yearsScore = Math.max(0, YEARS_SMOKING.findIndex(y => y.key === o.yearsSmoking));
      const riskKey = healthRiskKey(ageFromYear(o.birthYear), bucketIdx, yearsScore);
      const firstStruggle = (o.struggles || [])[0];
      return { startMid, savings, hours, riskKey, firstStruggle, tipKeys, days };
    }

    function planScreenHtml(p, opts) {
      const headline = p.firstStruggle ? T('h_' + p.firstStruggle) : T('h_default');
      const tips = (p.tipKeys.length ? p.tipKeys.map(k => T('tip_' + k)) : [T('tip_default1'), T('tip_default2')]);
      return `
        <div class="plan-screen">
          <h1 class="plan-title">${esc(headline)}</h1>
          <div class="plan-days"><div class="plan-days-num">${p.days}</div><div class="plan-days-label">${esc(T('plan_days'))}</div></div>
          <div class="plan-stat-grid">
            <div class="plan-stat-tile"><p class="plan-stat-label">${esc(T('plan_duration'))}</p><div class="plan-stat-value">${esc(T(opts.durationKey))}</div></div>
            <div class="plan-stat-tile"><p class="plan-stat-label">${esc(T('plan_daily'))}</p><div class="plan-stat-value">${esc(T('plan_daily_value', { n: p.startMid, units: Substances.unit(state.onboarding.substance || Substances.DEFAULT, lang, 2) }))}</div></div>
            <div class="plan-stat-tile"><p class="plan-stat-label">${esc(T('plan_savings'))}</p><div class="plan-stat-value">$${p.savings}</div></div>
            ${p.hours != null ? `<div class="plan-stat-tile"><p class="plan-stat-label">${esc(T('plan_time'))}</p><div class="plan-stat-value">${esc(T('plan_hours', { n: p.hours }))}</div></div>` : ''}
          </div>
          <div class="plan-risk plan-risk--${RISK_CLASS[p.riskKey]}">
            <div class="plan-risk-head">
              <span class="plan-risk-label">${esc(T('risk_label'))}</span>
              <span class="plan-risk-level">${esc(T('risk_' + p.riskKey))}</span>
            </div>
            <p class="plan-risk-msg">${esc(T('risk_msg_' + p.riskKey))}</p>
          </div>
          <p class="plan-tips-title">${esc(T('tips_title'))}</p>
          <div class="plan-tips">${tips.map(t => `<div class="plan-tip"><span class="plan-tip-dot">✓</span><span>${esc(t)}</span></div>`).join('')}</div>
          <button type="button" class="plan-cta" data-action="${opts.ctaAction}">${esc(T('lets_start'))}</button>
        </div>
      `;
    }

    function renderPlan() {
      const p = computePlan(30);
      panel._computedPlan = p;
      panel.innerHTML = planScreenHtml(p, { durationKey: 'plan_30days', ctaAction: 'plan-start' });
    }

    function finishOnboarding() {
      const p = panel._computedPlan || computePlan();
      state.onboarding.completed = true;
      state.onboarding.rated = true;
      state.profile.language = state.onboarding.language || 'en';
      state.profile.name = (state.onboarding.name || '').trim() || state.profile.name;
      state.profile.substance = state.onboarding.substance || Substances.DEFAULT;
      state.profile.premium = false;
      state.program.startDate = Store.todayKey();
      state.program.durationMonths = 1;
      state.program.startCount = p.startMid;
      state.program.endCount = 0;
      state.program.method = 'gradual';
      Store.save(state);
      document.removeEventListener('click', onGlobalClick);
      if (loadingTimer) clearInterval(loadingTimer);
      onComplete(state);
    }

    function render() {
      applyDir();
      switch (step) {
        case 'language': renderOptionsStep({
          title: T('lang_title'), subtitle: T('lang_sub'),
          options: I18N.LANGS.map(l => ({ key: l.code, label: l.label, emoji: LANGUAGE_FLAGS[l.code] || '' })),
          selected: state.onboarding.language
        }); break;
        case 'name': renderName(); break;
        case 'birthdate': renderBirthdate(); break;
        case 'gender': renderOptionsStep({ title: T('gender_title'), options: [{ key: 'Male', label: T('male') }, { key: 'Female', label: T('female') }], selected: state.onboarding.gender }); break;
        case 'substance': renderOptionsStep({
          title: T('substance_title'),
          options: [
            { key: 'cigarettes', label: T('substance_opt_cigarettes'), sub: T('substance_opt_cigarettes_sub'), icon: Icons.svg(Substances.icon('cigarettes'), 20), iconClass: 'tile-blue' },
            { key: 'cannabis', label: T('substance_opt_cannabis'), icon: Icons.svg(Substances.icon('cannabis'), 20), iconClass: 'tile-green' },
            { key: 'vape', label: T('substance_opt_vape'), sub: T('substance_opt_vape_sub'), icon: Icons.svg(Substances.icon('vape'), 20), iconClass: 'tile-violet' }
          ],
          selected: state.onboarding.substance
        }); break;
        case 'subtype': {
          const cfg = Substances.get(state.onboarding.substance).onboardingSubtype;
          renderOptionsStep({
            title: T(cfg.titleKey),
            options: cfg.options.map(o => ({ key: o.key, label: o.i18nKey ? T(o.i18nKey) : o.label })),
            selected: state.onboarding.subtype
          });
          break;
        }
        case 'cigsPerDay': {
          const freq = Substances.get(state.onboarding.substance).onboardingFrequency;
          renderOptionsStep({ title: T(freq.titleKey), subtitle: T(freq.subKey), options: CIGS_PER_DAY.map(c => ({ key: c.key, label: freqLabel(c) })), selected: state.onboarding.cigsPerDay });
          break;
        }
        case 'yearsSmoking': renderOptionsStep({ title: T('years_title'), subtitle: T('years_sub'), options: YEARS_SMOKING.map(y => ({ key: y.key, label: optLabel(y) })), selected: state.onboarding.yearsSmoking }); break;
        case 'referral': renderOptionsStep({ title: T('ref_title'), options: REFERRALS.map(r => ({ key: r.key, label: optLabel(r) })), selected: state.onboarding.referral }); break;
        case 'struggles': renderOptionsStep({ title: T('struggle_title'), subtitle: T('struggle_sub'), options: STRUGGLES.map(s => ({ key: s.key, label: optLabel(s) })), multi: true, max: 2, selected: state.onboarding.struggles }); break;
        case 'rating': renderRating(); break;
        case 'loading': renderLoading(); break;
        case 'plan': renderPlan(); break;
      }
    }

    function goToStep(name) { step = name; render(); }

    function goBack() {
      const idx = QUIZ_ORDER.indexOf(step);
      if (idx > 0) goToStep(QUIZ_ORDER[idx - 1]);
    }

    function goNextFromQuiz() {
      const idx = QUIZ_ORDER.indexOf(step);
      if (idx < QUIZ_ORDER.length - 1) goToStep(QUIZ_ORDER[idx + 1]);
      else goToStep('loading');
    }

    function handleSelectOption(currentStep, value) {
      const o = state.onboarding;
      switch (currentStep) {
        case 'language': o.language = value; lang = value; if (global.I18N && I18N.setLang) I18N.setLang(value); render(); return;
        case 'gender': o.gender = value; break;
        case 'substance': o.substance = value; o.subtype = null; break;
        case 'subtype': o.subtype = value; break;
        case 'cigsPerDay': o.cigsPerDay = value; break;
        case 'yearsSmoking': o.yearsSmoking = value; break;
        case 'referral': o.referral = value; break;
        case 'struggles': {
          const i = o.struggles.indexOf(value);
          if (i >= 0) o.struggles.splice(i, 1);
          else if (o.struggles.length < 2) o.struggles.push(value);
          break;
        }
      }
      render();
    }

    panel.addEventListener('input', e => {
      if (step === 'name' && e.target.id === 'qName') {
        const o = state.onboarding;
        o.name = e.target.value;
        const cta = panel.querySelector('.quiz-cta');
        if (cta) cta.disabled = !o.name.trim();
        return;
      }
      if (step === 'birthdate' && ['dobDay', 'dobMonth', 'dobYear'].includes(e.target.id)) {
        const o = state.onboarding;
        o.birthDay = parseInt(document.getElementById('dobDay').value, 10) || null;
        o.birthMonth = parseInt(document.getElementById('dobMonth').value, 10) || null;
        o.birthYear = parseInt(document.getElementById('dobYear').value, 10) || null;
        const valid = o.birthDay >= 1 && o.birthDay <= 31 && o.birthMonth >= 1 && o.birthMonth <= 12 &&
          o.birthYear >= 1930 && o.birthYear <= new Date().getFullYear();
        const cta = panel.querySelector('.quiz-cta');
        if (cta) cta.disabled = !valid;
      }
    });

    function onGlobalClick(e) {
      const el = e.target.closest('[data-action]');
      if (!el || el.disabled) return;
      const action = el.dataset.action;

      if (action === 'popup-star' || action === 'popup-not-now') {
        closeRatingPopup();
        goToStep('loading');
        return;
      }
      if (!panel.contains(e.target)) return;

      switch (action) {
        case 'back': goBack(); break;
        case 'continue': goNextFromQuiz(); break;
        case 'select-option': handleSelectOption(step, el.dataset.value); break;
        case 'rate-continue': showRatingPopup(); break;
        case 'plan-start': finishOnboarding(); break;
      }
    }

    document.addEventListener('click', onGlobalClick);
    render();
  }

  global.Onboarding = { start };
})(window);
