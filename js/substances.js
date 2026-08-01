/* Substance configuration: single source of truth for everything that differs
   between cigarettes / cannabis / vape (icon, pricing, log types, onboarding
   sub-steps, health milestones). Cigarettes preserve every value that used to
   live in Store, so existing users see zero behavior change. */
(function (global) {
  const CIGARETTE_HEALTH_MILESTONES = [
    { hours: 0.33, stage: 0, key: 'hm_1' }, { hours: 8, stage: 0, key: 'hm_2' }, { hours: 12, stage: 0, key: 'hm_3' },
    { hours: 24, stage: 0, key: 'hm_4' }, { hours: 48, stage: 1, key: 'hm_5' }, { hours: 72, stage: 1, key: 'hm_6' },
    { hours: 168, stage: 1, key: 'hm_7' }, { hours: 336, stage: 2, key: 'hm_8' }, { hours: 720, stage: 2, key: 'hm_9' },
    { hours: 2160, stage: 2, key: 'hm_10' }, { hours: 4320, stage: 2, key: 'hm_11' }, { hours: 6552, stage: 3, key: 'hm_12' },
    { hours: 8760, stage: 3, key: 'hm_13' }, { hours: 17520, stage: 3, key: 'hm_14' }, { hours: 26280, stage: 3, key: 'hm_15' }
  ];

  const CANNABIS_HEALTH_MILESTONES = [
    { hours: 2, stage: 0, key: 'hm_cannabis_1' }, { hours: 24, stage: 0, key: 'hm_cannabis_2' },
    { hours: 72, stage: 1, key: 'hm_cannabis_3' }, { hours: 168, stage: 1, key: 'hm_cannabis_4' },
    { hours: 720, stage: 2, key: 'hm_cannabis_5' }, { hours: 2160, stage: 2, key: 'hm_cannabis_6' },
    { hours: 4320, stage: 2, key: 'hm_cannabis_7' }, { hours: 8760, stage: 3, key: 'hm_cannabis_8' }
  ];

  const VAPE_HEALTH_MILESTONES = [
    { hours: 0.33, stage: 0, key: 'hm_vape_1' }, { hours: 12, stage: 0, key: 'hm_vape_2' },
    { hours: 24, stage: 0, key: 'hm_vape_3' }, { hours: 72, stage: 1, key: 'hm_vape_4' },
    { hours: 168, stage: 1, key: 'hm_vape_5' }, { hours: 720, stage: 2, key: 'hm_vape_6' },
    { hours: 2160, stage: 2, key: 'hm_vape_7' }, { hours: 8760, stage: 3, key: 'hm_vape_8' }
  ];

  const CONFIG = {
    cigarettes: {
      icon: 'cigarette',
      nicotineApplies: true,
      pricePerUnit: 1.9,
      lifeImpactMinutesPerUnit: 11,
      csvPrefix: 'smoking-log',
      nounTable: {
        en: { singular: 'cigarette', plural: 'cigarettes' },
        he: { singular: 'סיגריה', plural: 'סיגריות' },
        ar: { singular: 'سيجارة', plural: 'سجائر' },
        es: { singular: 'cigarrillo', plural: 'cigarrillos' },
        fr: { singular: 'cigarette', plural: 'cigarettes' },
        ru: { singular: 'сигарета', plural: 'сигарет' }
      },
      types: [
        { key: 'Regular cigarettes', i18nKey: 'cig_regular' },
        { key: 'Light cigarettes', i18nKey: 'cig_light' },
        { key: 'Roll-your-own', i18nKey: 'cig_roll' },
        { key: 'Cigar', i18nKey: 'cig_cigar' },
        { key: 'Other', i18nKey: 'cig_other' }
      ],
      nicotineMgPerType: {
        'Regular cigarettes': 1.1, 'Light cigarettes': 0.6, 'Roll-your-own': 0.8, 'Cigar': 3.0, 'Other': 1.0
      },
      onboardingSubtype: {
        titleKey: 'brand_title',
        options: ['Marlboro', 'Winston', 'Parliament', 'Camel', 'Time', 'Noblesse'].map(b => ({ key: b, label: b }))
      },
      onboardingFrequency: { titleKey: 'cigs_title', subKey: 'cigs_sub' },
      healthMilestones: CIGARETTE_HEALTH_MILESTONES
    },
    cannabis: {
      icon: 'leaf',
      nicotineApplies: false,
      pricePerUnit: 35,
      lifeImpactMinutesPerUnit: null,
      csvPrefix: 'cannabis-log',
      nounTable: {
        en: { singular: 'use', plural: 'uses' },
        he: { singular: 'שימוש', plural: 'שימושים' },
        ar: { singular: 'استخدام', plural: 'استخدامات' },
        es: { singular: 'uso', plural: 'usos' },
        fr: { singular: 'usage', plural: 'usages' },
        ru: { singular: 'приём', plural: 'приёмов' }
      },
      types: [
        { key: 'Joint', i18nKey: 'cann_type_joint' },
        { key: 'Bong hit', i18nKey: 'cann_type_bong' },
        { key: 'Edible', i18nKey: 'cann_type_edible' },
        { key: 'Vape/dab', i18nKey: 'cann_type_vape' },
        { key: 'Other', i18nKey: 'cann_type_other' }
      ],
      nicotineMgPerType: null,
      onboardingSubtype: {
        titleKey: 'subtype_cannabis_title',
        options: [
          { key: 'joint', i18nKey: 'method_joint' },
          { key: 'bong', i18nKey: 'method_bong' },
          { key: 'pipe', i18nKey: 'method_pipe' },
          { key: 'edible', i18nKey: 'method_edible' },
          { key: 'vape_pen', i18nKey: 'method_vape_pen' },
          { key: 'other', i18nKey: 'method_other' }
        ]
      },
      onboardingFrequency: { titleKey: 'freq_cannabis_title', subKey: 'freq_cannabis_sub' },
      healthMilestones: CANNABIS_HEALTH_MILESTONES
    },
    vape: {
      icon: 'vape',
      nicotineApplies: true,
      pricePerUnit: 0.3,
      lifeImpactMinutesPerUnit: null,
      csvPrefix: 'vape-log',
      nounTable: {
        en: { singular: 'puff', plural: 'puffs' },
        he: { singular: 'שאיפה', plural: 'שאיפות' },
        ar: { singular: 'نفس', plural: 'أنفاس' },
        es: { singular: 'calada', plural: 'caladas' },
        fr: { singular: 'bouffée', plural: 'bouffées' },
        ru: { singular: 'затяжка', plural: 'затяжек' }
      },
      types: [
        { key: 'Disposable device', i18nKey: 'vape_type_disposable' },
        { key: 'Pod/cartridge', i18nKey: 'vape_type_pod' },
        { key: 'Freebase e-liquid', i18nKey: 'vape_type_freebase' },
        { key: 'Salt-nic e-liquid', i18nKey: 'vape_type_saltnic' },
        { key: 'Other', i18nKey: 'vape_type_other' }
      ],
      nicotineMgPerType: {
        'Disposable device': 2.0, 'Pod/cartridge': 1.5, 'Freebase e-liquid': 0.5, 'Salt-nic e-liquid': 1.0, 'Other': 1.0
      },
      onboardingSubtype: {
        titleKey: 'subtype_vape_title',
        options: [
          { key: 'disposable', i18nKey: 'device_disposable' },
          { key: 'pod', i18nKey: 'device_pod' },
          { key: 'mod', i18nKey: 'device_mod' },
          { key: 'heated_tobacco', i18nKey: 'device_heated_tobacco' },
          { key: 'refillable', i18nKey: 'device_refillable' },
          { key: 'other', i18nKey: 'device_other' }
        ]
      },
      onboardingFrequency: { titleKey: 'freq_vape_title', subKey: 'freq_vape_sub' },
      healthMilestones: VAPE_HEALTH_MILESTONES
    }
  };

  const LIST = ['cigarettes', 'cannabis', 'vape'];
  const DEFAULT = 'cigarettes';

  function get(id) {
    return CONFIG[id] || CONFIG[DEFAULT];
  }

  function types(id) {
    return get(id).types;
  }

  function typeLabel(id, value) {
    const entry = types(id).find(t => t.key === value);
    if (!entry) return value;
    return (global.I18N ? global.I18N.t(entry.i18nKey) : entry.i18nKey);
  }

  function unit(id, lang, count) {
    const table = get(id).nounTable;
    const entry = table[lang] || table.en;
    return count === 1 ? entry.singular : entry.plural;
  }

  function icon(id) {
    return get(id).icon;
  }

  function healthMilestones(id) {
    return get(id).healthMilestones;
  }

  global.Substances = { LIST, DEFAULT, get, types, typeLabel, unit, icon, healthMilestones };
})(window);
