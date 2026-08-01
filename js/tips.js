/* Daily wellbeing tips shown as a three-segment wheel on Home.
   Yellow = nutrition, red = activity, blue = sleep. Tapping a segment opens
   that topic's tip for today; the tip rotates each day (deterministic by date,
   so everyone sees the same tip on a given day and it changes at midnight). */
(function (global) {
  // Vivid, saturated segment colours (stronger than the muted app accents).
  const TOPICS = [
    { key: 'nutrition', color: '#FFC400', ink: '#10233f', a0: -150, a1: -30 },
    { key: 'activity', color: '#E8322B', ink: '#ffffff', a0: -30, a1: 90 },
    { key: 'sleep', color: '#1478E0', ink: '#ffffff', a0: 90, a1: 210 }
  ];

  // Tips per language → topic → array. Falls back to English for missing langs.
  const TIPS = {
    en: {
      nutrition: [
        'Drink a glass of water before each meal — it curbs cravings and helps digestion.',
        'Swap one sugary drink today for water or unsweetened tea.',
        'Add a handful of nuts or seeds — the healthy fats keep you full longer.',
        'Fill half your plate with vegetables at your next meal.',
        'Keep cut fruit or veggies within reach for when a craving hits.',
        'Eat slowly and put your fork down between bites — you\'ll notice fullness sooner.',
        'Have a protein-rich breakfast to steady your energy through the morning.'
      ],
      activity: [
        'Take a brisk 10-minute walk — it cuts cravings as effectively as a short break.',
        'Do 20 bodyweight squats right now; movement resets a restless mind.',
        'Stretch for 5 minutes when you wake up to loosen stiff muscles.',
        'Take the stairs instead of the elevator at least once today.',
        'Stand up and move for 2 minutes every hour you\'re sitting.',
        'Try 10 slow, deep breaths with light stretching to release tension.',
        'End your day with a gentle walk — it aids digestion and sleep.'
      ],
      sleep: [
        'Aim for the same bedtime tonight — a steady rhythm deepens your rest.',
        'Put screens away 30 minutes before bed; the light delays sleep.',
        'Keep your room cool and dark for the most restorative sleep.',
        'Avoid caffeine after mid-afternoon so it doesn\'t linger at bedtime.',
        'Try 4-7-8 breathing in bed: inhale 4s, hold 7s, exhale 8s.',
        'Write down tomorrow\'s worries before bed to quiet a busy mind.',
        'Get a few minutes of morning daylight to set your body clock.'
      ]
    },
    he: {
      nutrition: [
        'שתה כוס מים לפני כל ארוחה — זה מפחית חשק ומסייע לעיכול.',
        'החלף היום משקה ממותק אחד במים או תה לא ממותק.',
        'הוסף חופן אגוזים או זרעים — השומנים הבריאים משביעים לזמן ארוך.',
        'מלא חצי מהצלחת בירקות בארוחה הבאה שלך.',
        'החזק פירות או ירקות חתוכים בהישג יד לרגעים של חשק.',
        'אכול לאט והנח את המזלג בין ביסים — תרגיש שובע מוקדם יותר.',
        'התחל את היום בארוחת בוקר עשירה בחלבון כדי לייצב את האנרגיה.'
      ],
      activity: [
        'צא להליכה נמרצת של 10 דקות — היא מפחיתה חשק ביעילות.',
        'עשה 20 סקוואטים עכשיו; תנועה מאפסת ראש חסר מנוחה.',
        'התמתח 5 דקות כשאתה קם כדי לשחרר שרירים תפוסים.',
        'עלה במדרגות במקום במעלית לפחות פעם אחת היום.',
        'קום וזוז שתי דקות בכל שעה של ישיבה.',
        'נסה 10 נשימות עמוקות ואיטיות עם מתיחות קלות כדי לשחרר מתח.',
        'סיים את היום בהליכה קלה — היא מסייעת לעיכול ולשינה.'
      ],
      sleep: [
        'לך לישון הלילה באותה שעה — קצב קבוע מעמיק את המנוחה.',
        'הרחק מסכים חצי שעה לפני השינה; האור מעכב את ההירדמות.',
        'שמור על חדר קריר וחשוך לשינה מרעננת יותר.',
        'הימנע מקפאין אחרי אמצע אחר הצהריים כדי שלא ילווה אותך למיטה.',
        'נסה נשימת 4-7-8 במיטה: שאיפה 4, החזקה 7, נשיפה 8.',
        'רשום את הדאגות של מחר לפני השינה כדי להשקיט את הראש.',
        'קבל כמה דקות של אור בוקר כדי לכוון את השעון הביולוגי.'
      ]
    },
    ar: {
      nutrition: [
        'اشرب كوب ماء قبل كل وجبة — يقلل الرغبة ويساعد الهضم.',
        'استبدل مشروباً سكرياً واحداً اليوم بالماء أو الشاي غير المحلى.',
        'أضف حفنة من المكسرات أو البذور — الدهون الصحية تُشبعك لفترة أطول.',
        'اجعل نصف طبقك خضروات في وجبتك القادمة.',
        'احتفظ بفاكهة أو خضار مقطّعة في متناول يدك عند الرغبة.',
        'كل ببطء وضع الشوكة بين اللقيمات — ستشعر بالشبع أسرع.',
        'تناول فطوراً غنياً بالبروتين ليثبت طاقتك طوال الصباح.'
      ],
      activity: [
        'امشِ بخطى سريعة 10 دقائق — يخفف الرغبة بفعالية.',
        'قم بـ20 تمرين قرفصاء الآن؛ الحركة تُهدّئ العقل المضطرب.',
        'مدّد عضلاتك 5 دقائق عند الاستيقاظ لتخفيف التيبّس.',
        'استخدم الدرج بدل المصعد مرة واحدة على الأقل اليوم.',
        'قف وتحرك دقيقتين كل ساعة جلوس.',
        'جرّب 10 أنفاس عميقة بطيئة مع تمدد خفيف لتحرير التوتر.',
        'أنهِ يومك بمشية هادئة — تساعد الهضم والنوم.'
      ],
      sleep: [
        'اذهب للنوم في نفس الوقت الليلة — الإيقاع الثابت يعمّق راحتك.',
        'ابعد الشاشات 30 دقيقة قبل النوم؛ الضوء يؤخر النوم.',
        'أبقِ غرفتك باردة ومظلمة لنوم أكثر استعادة للنشاط.',
        'تجنّب الكافيين بعد منتصف العصر كي لا يبقى وقت النوم.',
        'جرّب تنفّس 4-7-8 في السرير: شهيق 4، حبس 7، زفير 8.',
        'دوّن هموم الغد قبل النوم لتهدئة العقل المشغول.',
        'احصل على دقائق من ضوء الصباح لضبط ساعتك البيولوجية.'
      ]
    },
    es: {
      nutrition: [
        'Bebe un vaso de agua antes de cada comida — reduce los antojos y ayuda a la digestión.',
        'Cambia hoy una bebida azucarada por agua o té sin azúcar.',
        'Añade un puñado de frutos secos — las grasas saludables sacian más.',
        'Llena la mitad del plato con verduras en tu próxima comida.',
        'Ten fruta o verdura cortada a mano para cuando llegue un antojo.',
        'Come despacio y suelta el tenedor entre bocados — notarás antes la saciedad.',
        'Desayuna con proteínas para mantener tu energía toda la mañana.'
      ],
      activity: [
        'Camina a paso ligero 10 minutos — corta los antojos con eficacia.',
        'Haz 20 sentadillas ahora; el movimiento reinicia una mente inquieta.',
        'Estírate 5 minutos al despertar para soltar los músculos.',
        'Usa las escaleras en vez del ascensor al menos una vez hoy.',
        'Levántate y muévete 2 minutos por cada hora sentado.',
        'Prueba 10 respiraciones profundas con estiramientos suaves para liberar tensión.',
        'Termina el día con un paseo suave — ayuda a la digestión y al sueño.'
      ],
      sleep: [
        'Acuéstate hoy a la misma hora — un ritmo estable profundiza el descanso.',
        'Aparta las pantallas 30 minutos antes de dormir; la luz retrasa el sueño.',
        'Mantén la habitación fresca y oscura para un sueño más reparador.',
        'Evita la cafeína desde media tarde para que no persista de noche.',
        'Prueba la respiración 4-7-8 en la cama: inhala 4, retén 7, exhala 8.',
        'Anota las preocupaciones de mañana antes de dormir para calmar la mente.',
        'Toma unos minutos de luz matinal para ajustar tu reloj interno.'
      ]
    },
    fr: {
      nutrition: [
        'Bois un verre d\'eau avant chaque repas — ça réduit les envies et aide la digestion.',
        'Remplace aujourd\'hui une boisson sucrée par de l\'eau ou un thé non sucré.',
        'Ajoute une poignée de noix — les bonnes graisses rassasient plus longtemps.',
        'Remplis la moitié de ton assiette de légumes au prochain repas.',
        'Garde des fruits ou légumes coupés à portée pour les envies.',
        'Mange lentement et pose ta fourchette entre les bouchées — tu sentiras la satiété plus tôt.',
        'Prends un petit-déjeuner riche en protéines pour une énergie stable le matin.'
      ],
      activity: [
        'Marche d\'un bon pas 10 minutes — ça coupe les envies efficacement.',
        'Fais 20 squats maintenant ; le mouvement apaise un esprit agité.',
        'Étire-toi 5 minutes au réveil pour dénouer les muscles.',
        'Prends l\'escalier plutôt que l\'ascenseur au moins une fois aujourd\'hui.',
        'Lève-toi et bouge 2 minutes par heure passée assis.',
        'Essaie 10 respirations profondes avec des étirements légers pour relâcher la tension.',
        'Termine ta journée par une marche douce — bonne pour la digestion et le sommeil.'
      ],
      sleep: [
        'Couche-toi à la même heure ce soir — un rythme régulier approfondit le repos.',
        'Range les écrans 30 minutes avant le coucher ; la lumière retarde le sommeil.',
        'Garde ta chambre fraîche et sombre pour un sommeil réparateur.',
        'Évite la caféine après le milieu d\'après-midi pour qu\'elle ne persiste pas.',
        'Essaie la respiration 4-7-8 au lit : inspire 4, retiens 7, expire 8.',
        'Note les soucis du lendemain avant de dormir pour apaiser l\'esprit.',
        'Prends quelques minutes de lumière matinale pour régler ton horloge interne.'
      ]
    },
    ru: {
      nutrition: [
        'Выпейте стакан воды перед едой — это снижает тягу и помогает пищеварению.',
        'Замените сегодня один сладкий напиток на воду или несладкий чай.',
        'Добавьте горсть орехов — полезные жиры дольше сохраняют сытость.',
        'Заполните половину тарелки овощами в следующий приём пищи.',
        'Держите под рукой нарезанные фрукты или овощи на случай тяги.',
        'Ешьте медленно и опускайте вилку между кусочками — насыщение придёт раньше.',
        'Завтракайте белковой пищей, чтобы энергия держалась всё утро.'
      ],
      activity: [
        'Пройдитесь быстрым шагом 10 минут — это эффективно снижает тягу.',
        'Сделайте 20 приседаний прямо сейчас; движение успокаивает беспокойный ум.',
        'Потянитесь 5 минут после пробуждения, чтобы размять мышцы.',
        'Хотя бы раз сегодня поднимитесь по лестнице вместо лифта.',
        'Вставайте и двигайтесь 2 минуты каждый час сидения.',
        'Попробуйте 10 медленных глубоких вдохов с лёгкой растяжкой, чтобы снять напряжение.',
        'Завершите день лёгкой прогулкой — она помогает пищеварению и сну.'
      ],
      sleep: [
        'Ложитесь сегодня в то же время — ровный ритм углубляет отдых.',
        'Уберите экраны за 30 минут до сна; свет откладывает засыпание.',
        'Держите комнату прохладной и тёмной для восстанавливающего сна.',
        'Избегайте кофеина после середины дня, чтобы он не мешал ночью.',
        'Попробуйте дыхание 4-7-8 в постели: вдох 4, задержка 7, выдох 8.',
        'Запишите завтрашние заботы перед сном, чтобы успокоить ум.',
        'Побудьте несколько минут на утреннем свету, чтобы настроить внутренние часы.'
      ]
    }
  };

  // Stricter, discipline-focused coaching tips for the year-long Premium plan —
  // separate rotation from the wellness wheel above, one per day.
  const PREMIUM_TIPS = {
    en: [
      'Pick one trigger today and plan your exact response to it in advance — don\'t leave it to willpower in the moment.',
      'Review your log from the last 3 days. Notice the pattern? Name it, out loud, right now.',
      'Set a hard rule for today: no cigarette within 10 minutes of waking. Hold the line.',
      'Tell one person today exactly where you are in your plan. Accountability beats motivation.',
      'When the urge hits, delay by exactly 10 minutes on a timer before deciding anything. Every time.',
      'Audit your environment: remove one smoking cue from your home or car today.',
      'Write down the real reason you started this plan. Read it before bed tonight.'
    ],
    he: [
      'בחר טריגר אחד להיום ותכנן מראש את התגובה המדויקת אליו — אל תשאיר את זה לכוח רצון ברגע האמת.',
      'סקור את היומן שלך משלושת הימים האחרונים. שם לב לדפוס? קרא לו בשם, בקול, עכשיו.',
      'קבע לעצמך כלל נוקשה להיום: לא לעשן ב-10 הדקות הראשונות אחרי היקיצה. עמוד בזה.',
      'ספר למישהו אחד היום בדיוק איפה אתה עומד בתוכנית. אחריות מנצחת מוטיבציה.',
      'כשהדחף עולה, דחה בדיוק 10 דקות עם טיימר לפני שתחליט משהו. בכל פעם.',
      'בדוק את הסביבה שלך: הסר היום גורם-טריגר אחד מהבית או מהרכב.',
      'כתוב את הסיבה האמיתית שבגללה התחלת את התוכנית הזו. קרא אותה לפני השינה הלילה.'
    ],
    ar: [
      'اختر محفزاً واحداً اليوم وخطط لردة فعلك الدقيقة عليه مسبقاً — لا تتركها لقوة الإرادة في اللحظة.',
      'راجع سجلّك من آخر 3 أيام. هل لاحظت نمطاً؟ سمِّه بصوت عالٍ الآن.',
      'ضع لنفسك قاعدة صارمة اليوم: لا سيجارة خلال 10 دقائق من الاستيقاظ. التزم بها.',
      'أخبر شخصاً واحداً اليوم بالضبط أين أنت في خطتك. المساءلة تتفوق على الحماس.',
      'عند اشتداد الرغبة، أجّل القرار 10 دقائق بالضبط باستخدام مؤقت. في كل مرة.',
      'راجع بيئتك: أزل اليوم محفزاً واحداً للتدخين من منزلك أو سيارتك.',
      'اكتب السبب الحقيقي الذي دفعك لبدء هذه الخطة. اقرأه قبل النوم الليلة.'
    ],
    es: [
      'Elige un desencadenante hoy y planea con antelación tu respuesta exacta — no lo dejes a la fuerza de voluntad del momento.',
      'Revisa tu registro de los últimos 3 días. ¿Notas un patrón? Nómbralo en voz alta ahora mismo.',
      'Ponte una regla estricta para hoy: ningún cigarrillo en los primeros 10 minutos tras despertar. Cúmplela.',
      'Cuéntale a alguien hoy exactamente en qué punto de tu plan estás. La rendición de cuentas vence a la motivación.',
      'Cuando llegue el impulso, retrasa la decisión exactamente 10 minutos con un temporizador. Cada vez.',
      'Revisa tu entorno: elimina hoy un detonante de fumar de tu casa o auto.',
      'Escribe la razón real por la que empezaste este plan. Léela antes de dormir esta noche.'
    ],
    fr: [
      'Choisis un déclencheur aujourd\'hui et planifie à l\'avance ta réponse exacte — ne laisse pas ça à la volonté du moment.',
      'Relis ton journal des 3 derniers jours. Tu remarques un schéma ? Nomme-le à voix haute, maintenant.',
      'Fixe-toi une règle stricte pour aujourd\'hui : aucune cigarette dans les 10 minutes après le réveil. Tiens bon.',
      'Dis à quelqu\'un aujourd\'hui exactement où tu en es dans ton plan. La responsabilisation bat la motivation.',
      'Quand l\'envie survient, retarde la décision de exactement 10 minutes avec un minuteur. À chaque fois.',
      'Audite ton environnement : supprime aujourd\'hui un déclencheur de ta maison ou de ta voiture.',
      'Écris la vraie raison pour laquelle tu as commencé ce plan. Relis-la avant de dormir ce soir.'
    ],
    ru: [
      'Выберите сегодня один триггер и заранее спланируйте точную реакцию на него — не полагайтесь на силу воли в моменте.',
      'Просмотрите свой журнал за последние 3 дня. Заметили закономерность? Назовите её вслух прямо сейчас.',
      'Установите себе жёсткое правило на сегодня: ни одной сигареты в первые 10 минут после пробуждения. Держитесь.',
      'Расскажите сегодня одному человеку, на каком именно этапе плана вы находитесь. Ответственность сильнее мотивации.',
      'Когда накатывает тяга, откладывайте решение ровно на 10 минут по таймеру. Каждый раз.',
      'Проверьте своё окружение: уберите сегодня один триггер курения из дома или машины.',
      'Запишите настоящую причину, по которой вы начали этот план. Перечитайте её перед сном сегодня.'
    ]
  };

  function todayIndex(len) {
    return Math.floor(Date.now() / 86400000) % len;
  }

  function dailyTip(topic) {
    const lang = (global.I18N && I18N.getLang && I18N.getLang()) || 'en';
    const set = (TIPS[lang] && TIPS[lang][topic]) || TIPS.en[topic];
    return set[todayIndex(set.length)];
  }

  function premiumDailyTip() {
    const lang = (global.I18N && I18N.getLang && I18N.getLang()) || 'en';
    const set = PREMIUM_TIPS[lang] || PREMIUM_TIPS.en;
    return set[todayIndex(set.length)];
  }

  function polar(cx, cy, r, deg) {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  function slicePath(cx, cy, r, a0, a1) {
    const [x0, y0] = polar(cx, cy, r, a0);
    const [x1, y1] = polar(cx, cy, r, a1);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`;
  }

  function wheelHtml() {
    const cx = 100, cy = 100, r = 96;
    // Colours only — topic names live in the HTML legend below, so text always
    // renders correctly (SVG <text> mangles Hebrew/RTL on some mobile browsers).
    const slices = TOPICS.map(t =>
      `<path class="tip-slice" d="${slicePath(cx, cy, r, t.a0, t.a1)}" fill="${t.color}"></path>`
    ).join('');
    const legend = TOPICS.map(t =>
      `<span class="tip-legend-item"><span class="tip-legend-dot" style="background:${t.color}"></span>${I18N.t('tip_topic_' + t.key)}</span>`
    ).join('');
    return `
      <div class="card tip-wheel-card">
        <p class="card-title" style="margin:0 0 2px;">${I18N.t('tip_daily_title')}</p>
        <p class="card-sub" style="margin:0 0 14px;">${I18N.t('tip_daily_sub')}</p>
        <div class="tip-wheel-wrap">
          <div class="tip-wheel-pointer"></div>
          <svg class="tip-wheel" id="tipWheel" viewBox="0 0 200 200" role="img" aria-label="${I18N.t('tip_daily_title')}">
            ${slices}
            <circle cx="100" cy="100" r="96" fill="none" stroke="var(--bg)" stroke-width="3"></circle>
            <circle cx="100" cy="100" r="14" fill="var(--surface)" stroke="var(--bg)" stroke-width="3"></circle>
          </svg>
        </div>
        <div class="tip-wheel-legend">${legend}</div>
        <button type="button" class="tip-spin-btn" data-action="tip-spin">${I18N.t('tip_spin')}</button>
      </div>`;
  }

  // Spin the wheel a few turns and land on a random topic, then reveal that
  // topic's tip for today. Colours-only wheel, so nothing needs counter-rotating.
  let rotation = 0;
  let spinning = false;
  function spin() {
    const wheel = document.getElementById('tipWheel');
    if (!wheel || spinning) return;
    spinning = true;
    const btn = document.querySelector('.tip-spin-btn');
    if (btn) btn.disabled = true;

    const i = Math.floor(Math.random() * TOPICS.length);
    const center = (TOPICS[i].a0 + TOPICS[i].a1) / 2;
    const targetMod = (((-90 - center) % 360) + 360) % 360;    // bring segment i under the top pointer
    const delta = 360 * 4 + (((targetMod - (rotation % 360)) % 360) + 360) % 360;
    rotation += delta;

    wheel.style.transition = 'transform 3s cubic-bezier(.15,.7,.15,1)';
    wheel.style.transform = `rotate(${rotation}deg)`;

    let finished = false;
    const done = () => {
      if (finished) return;                 // fire once, whichever trigger wins
      finished = true;
      wheel.removeEventListener('transitionend', done);
      spinning = false;
      if (btn) btn.disabled = false;
      Modal.openGeneric(sheetHtml(TOPICS[i].key));
    };
    wheel.addEventListener('transitionend', done);
    setTimeout(done, 3200);                  // fallback if transitionend never fires
  }

  function sheetHtml(topic) {
    return `
      <h2>${I18N.t('tip_topic_' + topic)}</h2>
      <p class="sheet-sub">${I18N.t('tip_of_the_day')}</p>
      <div class="tip-sheet-body">
        <div class="tip-sheet-mark tip-mark-${topic}">${Icons.svg(topic === 'nutrition' ? 'leaf' : topic === 'activity' ? 'run' : 'moon', 20)}</div>
        <p class="tip-sheet-text">${Charts.esc(dailyTip(topic))}</p>
      </div>
      <div class="sheet-actions">
        <button type="button" class="btn btn-primary btn-block" data-action="close-generic">${I18N.t('modal_got_it')}</button>
      </div>`;
  }

  global.Tips = { wheelHtml, sheetHtml, dailyTip, spin, TIPS, premiumDailyTip };
})(window);
