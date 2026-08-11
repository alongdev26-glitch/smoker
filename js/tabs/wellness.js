/* Wellness tab - Guided exercises to help manage cravings */
(function (global) {
  const EXERCISES = [
    {
      id: 'breathing-box',
      category: 'breathing',
      name: 'Box Breathing',
      nameHe: 'נשימה בתיבה',
      description: 'Calm your nervous system with structured breathing. Inhale, hold, exhale, hold for 4 counts each.',
      descriptionHe: 'הרגע את מערכת העצבים שלך בנשימה מובנית. שאוף, החזק, שחרר, החזק 4 ספירות כל אחד.',
      duration: '2-3 min',
      icon: '💨',
      steps: [
        { en: 'Inhale for 4 counts', he: 'שאוף 4 ספירות' },
        { en: 'Hold for 4 counts', he: 'החזק 4 ספירות' },
        { en: 'Exhale for 4 counts', he: 'שחרר 4 ספירות' },
        { en: 'Hold for 4 counts', he: 'החזק 4 ספירות' },
        { en: 'Repeat 5-10 times', he: 'חזור 5-10 פעמים' }
      ]
    },
    {
      id: 'breathing-4-7-8',
      category: 'breathing',
      name: '4-7-8 Breathing',
      nameHe: 'נשימת 4-7-8',
      description: 'A powerful relaxation technique. Inhale for 4, hold for 7, exhale for 8 counts.',
      descriptionHe: 'טכניקת הרפיה חזקה. שאוף 4, החזק 7, שחרר 8 ספירות.',
      duration: '1-2 min',
      icon: '😌',
      steps: [
        { en: 'Inhale for 4 counts', he: 'שאוף 4 ספירות' },
        { en: 'Hold breath for 7 counts', he: 'החזק נשימה 7 ספירות' },
        { en: 'Exhale slowly for 8 counts', he: 'שחרר לאט 8 ספירות' },
        { en: 'Repeat 4 times', he: 'חזור 4 פעמים' }
      ]
    },
    {
      id: 'breathing-diaphragm',
      category: 'breathing',
      name: 'Diaphragm Breathing',
      nameHe: 'נשימת דיאפרגמה',
      description: 'Deep belly breathing that naturally calms. Breathe in through your nose, out through your mouth.',
      descriptionHe: 'נשימה עמוקה בבטן שמרגיעה באופן טבעי. שאוף באף, שחרר בפה.',
      duration: '3-5 min',
      icon: '🌬️',
      steps: [
        { en: 'Sit comfortably with hand on belly', he: 'שב בנוח עם יד על הבטן' },
        { en: 'Breathe in slowly through nose (5 sec)', he: 'שאוף לאט דרך האף (5 שניות)' },
        { en: 'Feel your belly expand', he: 'הרגיש את הבטן מתרחבת' },
        { en: 'Exhale slowly through mouth (5 sec)', he: 'שחרר לאט דרך הפה (5 שניות)' },
        { en: 'Repeat for 3-5 minutes', he: 'חזור 3-5 דקות' }
      ]
    },
    {
      id: 'walk-slow',
      category: 'walking',
      name: 'Mindful Walk',
      nameHe: 'הליכה מודעת',
      description: 'A slow, intentional walk to clear your mind and break the craving cycle.',
      descriptionHe: 'הליכה איטית ויעודית כדי לנקות את הראש שלך ולשבור את מחזור ההנשימה.',
      duration: '10-15 min',
      icon: '🚶',
      steps: [
        { en: 'Step outside or walk around home', he: 'יצא החוצה או הלך בבית' },
        { en: 'Walk slowly, focus on each step', he: 'הלך לאט, התמקד בכל צעד' },
        { en: 'Notice sounds, smells, sights', he: 'שים לב לקולות, ריחות, נופים' },
        { en: 'Breathe deeply as you walk', he: 'נשום עמוק בעודך הולך' },
        { en: 'Continue for 10-15 minutes', he: 'המשך 10-15 דקות' }
      ]
    },
    {
      id: 'walk-brisk',
      category: 'walking',
      name: 'Brisk Walk',
      nameHe: 'הליכה מהירה',
      description: 'A faster walk to burn energy and reduce cravings through physical activity.',
      descriptionHe: 'הליכה מהירה לשריפת אנרגיה והפחתת הנשימות דרך פעילות גופנית.',
      duration: '15-20 min',
      icon: '🏃',
      steps: [
        { en: 'Walk at a brisk pace (3-4 mph)', he: 'הלך בקצב מהיר (3-4 mph)' },
        { en: 'Swing your arms naturally', he: 'החזק את זרועותיך בטבעיות' },
        { en: 'Maintain steady breathing', he: 'שמור נשימה יציבה' },
        { en: 'Keep your chin up, eyes forward', he: 'שמור סנטר למעלה, עיניים קדימה' },
        { en: 'Aim for 15-20 minutes', he: 'יעד 15-20 דקות' }
      ]
    },
    {
      id: 'strength-stretches',
      category: 'strength',
      name: 'Stretching',
      nameHe: 'מתיחה',
      description: 'Gentle stretches to release tension and increase blood flow.',
      descriptionHe: 'מתיחות עדינות לשחרור המתח והגברת זרימת הדם.',
      duration: '5-10 min',
      icon: '🤸',
      steps: [
        { en: 'Neck rolls: Slowly roll your head 5 times each direction', he: 'גלגלי צוואר: גלגל לאט את ראשך 5 פעמים בכל כיוון' },
        { en: 'Shoulder shrugs: Lift shoulders to ears, hold 2 sec, release (10x)', he: 'הרמת כתפיים: הרם כתפיים לאוזניים, החזק 2 שניות, שחרר (10x)' },
        { en: 'Touch toes: Bend forward gently, hold 20 seconds', he: 'גע בבהונות: התכופף קדימה בעדינות, החזק 20 שניות' },
        { en: 'Quad stretch: Pull foot to buttock, hold 20 sec each leg', he: 'מתיחת אומביליק: משוך רגל לעכוז, החזק 20 שניות כל רגל' },
        { en: 'All done! Feel the difference', he: 'סיימנו! הרגיש את ההבדל' }
      ]
    },
    {
      id: 'strength-pushups',
      category: 'strength',
      name: 'Push-ups',
      nameHe: 'דחיפות',
      description: 'Build strength and boost confidence with controlled push-ups.',
      descriptionHe: 'בנה כוח ותגביר ביטחון עם דחיפות מבוקרות.',
      duration: '5 min',
      icon: '💪',
      steps: [
        { en: 'Lie face down on floor or on knees', he: 'שכב עם הפנים למטה על הרצפה או על הברכיים' },
        { en: 'Place hands shoulder-width apart', he: 'הנח ידיים בחוד כתף' },
        { en: 'Push yourself up until arms are straight', he: 'דחוף עצמך למעלה עד שהזרועות ישרות' },
        { en: 'Lower yourself back down slowly', he: 'הנמך את עצמך לאט למטה' },
        { en: 'Do as many as comfortable (5-20 reps)', he: 'עשה כמה שנוח (5-20 חזרות)' }
      ]
    },
    {
      id: 'strength-plank',
      category: 'strength',
      name: 'Plank Hold',
      nameHe: 'החזקת לוח',
      description: 'A powerful core exercise that builds strength and mental resilience.',
      descriptionHe: 'תרגיל ליבה חזק שבונה כוח וגמישות נפשית.',
      duration: '2-3 min',
      icon: '🔥',
      steps: [
        { en: 'Get in push-up position', he: 'תיכנס לתנוחת דחיפה' },
        { en: 'Forearms on ground, elbows under shoulders', he: 'קדמי זרועות על הקרקע, מרפקים תחת כתפיים' },
        { en: 'Keep body straight from head to heels', he: 'שמור גוף ישר מראש לעקבים' },
        { en: 'Tighten core and hold', he: 'הדק את הליבה והחזק' },
        { en: 'Hold for 20-60 seconds, rest, repeat 2-3 times', he: 'החזק 20-60 שניות, נח, חזור 2-3 פעמים' }
      ]
    }
  ];

  function getExercises() {
    const lang = global.I18N ? global.I18N.getLang() : 'en';
    return EXERCISES.map(e => ({
      ...e,
      displayName: lang === 'he' ? e.nameHe : e.name,
      displayDesc: lang === 'he' ? e.descriptionHe : e.description,
      displaySteps: e.steps.map(s => lang === 'he' ? s.he : s.en)
    }));
  }

  function exerciseCardHtml(exercise) {
    return `
      <div class="exercise-card">
        <div class="exercise-header">
          <span class="exercise-icon">${exercise.icon}</span>
          <div class="exercise-title-wrap">
            <p class="exercise-title">${Charts.esc(exercise.displayName)}</p>
            <p class="exercise-duration">${Charts.esc(exercise.duration)}</p>
          </div>
        </div>
        <p class="exercise-description">${Charts.esc(exercise.displayDesc)}</p>
        <button class="btn btn-secondary" data-action="start-exercise" data-id="${exercise.id}">Start Exercise</button>
      </div>
    `;
  }

  function exerciseDetailHtml(exercise) {
    const lang = I18N.getLang();
    const isHe = lang === 'he';
    return `
      <div class="exercise-detail">
        <div class="exercise-detail-header">
          <button type="button" class="btn btn-ghost" data-action="close-generic" style="align-self:flex-start;">← Back</button>
          <div style="text-align:center;">
            <p style="font-size:40px;margin:10px 0;line-height:1;">${exercise.icon}</p>
            <h2 style="font-size:20px;font-weight:700;margin:0;color:var(--text-primary);">${Charts.esc(exercise.displayName)}</h2>
            <p style="font-size:13px;color:var(--text-muted);margin:4px 0 0;">${Charts.esc(exercise.duration)}</p>
          </div>
        </div>
        <p class="exercise-detail-desc">${Charts.esc(exercise.displayDesc)}</p>
        <div class="exercise-steps">
          <h3 style="font-size:14px;font-weight:600;margin:0 0 12px;color:var(--text-primary);">${I18N.t('wellness_steps')}</h3>
          ${exercise.displaySteps.map((step, i) => `
            <div class="exercise-step">
              <span class="exercise-step-num">${i + 1}</span>
              <p class="exercise-step-text">${Charts.esc(step)}</p>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-primary" style="width:100%;margin-top:16px;" data-action="close-generic">${I18N.t('wellness_got_it')}</button>
      </div>
    `;
  }

  function categoryCardHtml(category, exercises) {
    const categoryName = I18N.t('wellness_' + category);
    return `
      <div class="wellness-category-card">
        <div class="category-header">
          <div class="category-info">
            <h3 class="category-title">${categoryName}</h3>
            <p class="category-desc" data-i18n="wellness_${category}_desc"></p>
          </div>
          <span class="category-icon">${exercises[0].icon}</span>
        </div>
        <div class="category-exercises">
          ${exercises.map(e => `
            <div class="exercise-item">
              <div class="exercise-item-left">
                <p class="exercise-item-name">${Charts.esc(e.displayName)}</p>
                <p class="exercise-item-duration">${Charts.esc(e.displayDuration)}</p>
              </div>
              <button class="exercise-item-btn" data-action="start-exercise" data-id="${e.id}">›</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function render(state) {
    const exercises = getExercises();
    const lang = I18N.getLang();

    const byCategory = {
      breathing: exercises.filter(e => e.category === 'breathing'),
      walking: exercises.filter(e => e.category === 'walking'),
      strength: exercises.filter(e => e.category === 'strength')
    };

    return `
      <div class="wellness-container">
        <div class="wellness-header">
          <h2 class="wellness-page-title" data-i18n="wellness_title">Wellness Exercises</h2>
          <p class="wellness-page-subtitle" data-i18n="wellness_subtitle">Manage cravings with guided activities</p>
        </div>

        <div class="wellness-categories">
          ${categoryCardHtml('breathing', byCategory.breathing)}
          ${categoryCardHtml('walking', byCategory.walking)}
          ${categoryCardHtml('strength', byCategory.strength)}
        </div>

        <div class="wellness-footer">
          <p class="wellness-tip-text" data-i18n="wellness_tip">💡 Most cravings last only 3-5 minutes. Pick an exercise and push through!</p>
        </div>
      </div>
    `;
  }

  global.Tabs = global.Tabs || {};
  global.Tabs.wellness = { render, getExercises, exerciseDetailHtml };
})(window);
