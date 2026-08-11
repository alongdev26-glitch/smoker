/* Testimonials tab - real stories from users who quit with Quitly */
(function (global) {
  // Testimonials data - can be extended with more stories
  const TESTIMONIALS = [
    {
      id: 'aliza',
      name: 'אליזה',
      duration: '23 days',
      durationHe: '23 ימים',
      story: 'התחלתי לעשן בגיל צעיר כשהייתי מתעצבן. ניסיתי הרבה דרכים להפסיק - קניתי קורסים, צפיתי בסרטונים, אבל כלום לא עזר עד שהכרתי את Qitly.',
      storyEn: 'I started smoking young when I was upset. I tried many ways to quit - bought courses, watched videos, but nothing helped until I met Qitly.',
      result: 'עכשיו אני חופשי מעשן וחוסך הרבה כסף!',
      resultEn: 'Now I am smoke-free and saving so much money!',
      avatar: '👩‍🦰',
      videoUrl: null // Can be added later
    },
    {
      id: 'david',
      name: 'דוד',
      duration: '45 days',
      durationHe: '45 ימים',
      story: 'כל ניסיון הקודם נכשל. Qitly עזר לי בגלל ה-Coach AI שלהם - זה כמו שיש מישהו שמבין את הקשיים שלי.',
      storyEn: 'Every previous attempt failed. Qitly helped me because of their AI Coach - it\'s like having someone who understands my struggles.',
      result: 'זו הפעם הראשונה שאני באמת מוטיבציה להמשיך!',
      resultEn: 'This is the first time I\'m truly motivated to continue!',
      avatar: '👨‍💼',
      videoUrl: null
    },
    {
      id: 'sarah',
      name: 'שרה',
      duration: '67 days',
      durationHe: '67 ימים',
      story: 'התוכנית הדרגתית נתנה לי אפשרות להיות בשליטה. לא היה עלי להפסיק בקור קוצים, סתם הקטנתי בהדרגה.',
      storyEn: 'The gradual plan gave me control. I didn\'t have to quit cold turkey, just reduced gradually.',
      result: 'בעוד שני שבועות אני חופשי לחלוטין!',
      resultEn: 'In two more weeks I\'ll be completely smoke-free!',
      avatar: '👩‍💻',
      videoUrl: null
    }
  ];

  function getTestimonials() {
    const lang = global.I18N ? global.I18N.getLang() : 'en';
    return TESTIMONIALS.map(t => ({
      ...t,
      displayName: t.name,
      displayStory: lang === 'he' ? t.story : t.storyEn,
      displayResult: lang === 'he' ? t.result : t.resultEn,
      displayDuration: lang === 'he' ? t.durationHe : t.duration
    }));
  }

  function testimonialCardHtml(testimonial) {
    const videoEmbed = testimonial.videoUrl ? `
      <div class="testimonial-video-wrap">
        <iframe width="100%" height="240" src="${testimonial.videoUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
    ` : '';

    return `
      <div class="testimonial-card">
        <div class="testimonial-header">
          <span class="testimonial-avatar">${testimonial.avatar}</span>
          <div class="testimonial-meta">
            <p class="testimonial-name">${Charts.esc(testimonial.displayName)}</p>
            <p class="testimonial-duration">${Charts.esc(testimonial.displayDuration)}</p>
          </div>
        </div>
        ${videoEmbed}
        <p class="testimonial-story">"${Charts.esc(testimonial.displayStory)}"</p>
        <p class="testimonial-result"><strong>${Charts.esc(testimonial.displayResult)}</strong></p>
      </div>
    `;
  }

  function render(state) {
    const testimonials = getTestimonials();
    const lang = I18N.getLang();
    const isHe = lang === 'he';

    return `
      <div class="testimonials-container">
        <div class="testimonials-intro">
          <h2 class="testimonials-title" data-i18n="testimonials_title">Real Stories</h2>
          <p class="testimonials-subtitle" data-i18n="testimonials_subtitle">See how others quit with Quitly</p>
        </div>

        <div class="testimonials-grid">
          ${testimonials.map(t => testimonialCardHtml(t)).join('')}
        </div>

        <div class="testimonials-cta">
          <h3 data-i18n="testimonials_your_story">Your story could be next</h3>
          <p class="testimonials-cta-sub" data-i18n="testimonials_cta_sub">Start your quit journey today with Quitly</p>
          <button class="btn btn-primary" data-action="quick-add" data-i18n="testimonials_get_started">Get Started</button>
        </div>
      </div>
    `;
  }

  global.Tabs = global.Tabs || {};
  global.Tabs.testimonials = { render, getTestimonials };
})(window);
