import React from 'react';
import { ArrowRight, Briefcase, CheckCircle2, ShieldCheck, Users } from 'lucide-react';
import {
  MotionConfig,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from 'motion/react';
import { Language, type TranslationDict } from '../../lib/i18n';
import { useT } from '../../config/CategoryContext';
import { CATEGORY_LIST, l10n, type CategoryConfig } from '../../config/categories';
import { ACCENT, CategoryIcon } from '../../config/CategoryIcon';
import type { CategoryId } from '../../types/category';

interface HomePageProps {
  currentLang: Language;
  onSelectCategory: (category: CategoryId) => void;
  onLanguageChange: (lang: Language) => void;
}

const STEPS = [
  { icon: Briefcase, title: 'home_step1_title', desc: 'home_step1_desc' },
  { icon: Users, title: 'home_step2_title', desc: 'home_step2_desc' },
  { icon: ShieldCheck, title: 'home_step3_title', desc: 'home_step3_desc' },
  { icon: CheckCircle2, title: 'home_step4_title', desc: 'home_step4_desc' },
] as const;

const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'en', label: 'English (EN)' },
  { id: 'si', label: 'සිංහල (SI)' },
  { id: 'ta', label: 'தமிழ் (TA)' },
];

// ---------------------------------------------------------------- motion presets

const EASE = [0.22, 1, 0.36, 1] as const;
const TILT_SPRING = { stiffness: 220, damping: 22, mass: 0.6 };

const stagger = (gap: number, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const titleWord: Variants = {
  hidden: { opacity: 0, y: '0.45em', filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: EASE } },
};

const card: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: EASE } },
  hover: { y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } },
  tap: { scale: 0.98 },
};

const cardIcon: Variants = {
  hover: { rotate: [0, -10, 8, 0], scale: 1.12, transition: { duration: 0.5 } },
};

const chipRow: Variants = { hover: { transition: { staggerChildren: 0.04 } } };
const chip: Variants = { hover: { y: -2 } };
const arrow: Variants = { hover: { x: 5 } };
const spotlightLayer: Variants = { hidden: { opacity: 0 }, show: { opacity: 0 }, hover: { opacity: 1 } };

const step: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

const stepBadge: Variants = {
  hidden: { scale: 0, rotate: -90 },
  show: { scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 260, damping: 14, delay: 0.15 } },
};

// ---------------------------------------------------------------- category card

interface CategoryCardProps {
  category: CategoryConfig;
  currentLang: Language;
  t: TranslationDict;
  still: boolean;
  onSelect: (id: CategoryId) => void;
}

/** A category card that tilts toward the pointer and lights up under it. */
const CategoryCard: React.FC<CategoryCardProps> = ({ category, currentLang, t, still, onSelect }) => {
  const accent = ACCENT[category.accent];

  // Pointer position over the card, 0..1 on each axis (0.5 = centre, no tilt).
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [7, -7]), TILT_SPRING);
  const rotateY = useSpring(useTransform(px, [0, 1], [-7, 7]), TILT_SPRING);
  const spotX = useTransform(px, v => `${v * 100}%`);
  const spotY = useTransform(py, v => `${v * 100}%`);
  const spotlight = useMotionTemplate`radial-gradient(380px circle at ${spotX} ${spotY}, ${accent.spotlight}, transparent 70%)`;

  const track = (e: React.PointerEvent<HTMLElement>) => {
    if (still) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const reset = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.button
      type="button"
      data-testid={`category-card-${category.id}`}
      onClick={() => onSelect(category.id)}
      onPointerMove={track}
      onPointerLeave={reset}
      variants={card}
      whileHover="hover"
      whileTap="tap"
      style={still ? undefined : { rotateX, rotateY, transformPerspective: 900 }}
      className={`group relative overflow-hidden text-left bg-slate-900 border border-slate-800 ${accent.hoverBorder} p-6 rounded-2xl space-y-4 flex flex-col justify-between transition-colors shadow-lg hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500`}
    >
      <motion.div
        aria-hidden
        variants={spotlightLayer}
        style={{ background: spotlight }}
        className="pointer-events-none absolute inset-0"
      />

      <div className="relative space-y-3">
        <motion.div
          variants={cardIcon}
          className={`w-12 h-12 rounded-2xl bg-slate-950 border ${accent.border} ${accent.text} flex items-center justify-center`}
        >
          <CategoryIcon icon={category.icon} className="w-6 h-6" />
        </motion.div>
        <h3 className="text-xl font-bold text-white">{l10n(category.label, currentLang)}</h3>
        <p className="text-sm text-slate-300">{l10n(category.tagline, currentLang)}</p>
        <p className="text-xs text-slate-400 leading-relaxed">{l10n(category.description, currentLang)}</p>

        <div className="pt-1">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">{t.home_card_for}</div>
          <motion.div variants={chipRow} className="flex flex-wrap gap-1.5">
            {category.roles.map(role => (
              <motion.span key={role.id} variants={chip} className={`text-[11px] px-2 py-0.5 rounded-full border ${accent.chip}`}>
                {l10n(role.label, currentLang)}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </div>

      <div className={`relative flex items-center space-x-1.5 text-sm font-bold ${accent.text}`}>
        <span>{t.home_card_cta}</span>
        <motion.span variants={arrow} className="inline-flex">
          <ArrowRight className="w-4 h-4" />
        </motion.span>
      </div>
    </motion.button>
  );
};

// ---------------------------------------------------------------- page

export const HomePage: React.FC<HomePageProps> = ({ currentLang, onSelectCategory, onLanguageChange }) => {
  const t = useT(currentLang);
  const still = useReducedMotion() ?? false;

  // The hero glows drift toward the pointer.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const glowX = useSpring(pointerX, { stiffness: 40, damping: 18 });
  const glowY = useSpring(pointerY, { stiffness: 40, damping: 18 });
  const counterX = useTransform(glowX, v => -v);
  const counterY = useTransform(glowY, v => -v);

  const followPointer = (e: React.PointerEvent<HTMLElement>) => {
    if (still) return;
    const r = e.currentTarget.getBoundingClientRect();
    pointerX.set(((e.clientX - r.left) / r.width - 0.5) * 60);
    pointerY.set(((e.clientY - r.top) / r.height - 0.5) * 40);
  };

  const breathe = (duration: number) =>
    still
      ? undefined
      : {
          animate: { scale: [1, 1.18, 1], opacity: [0.55, 0.9, 0.55] },
          transition: { duration, repeat: Infinity, ease: 'easeInOut' as const },
        };

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-14 pb-12">
        {/* Hero */}
        <motion.section
          onPointerMove={followPointer}
          variants={stagger(0.12)}
          initial="hidden"
          animate="show"
          className="relative isolate text-center max-w-3xl mx-auto pt-4 sm:pt-10 space-y-5"
        >
          <div aria-hidden className="pointer-events-none absolute -inset-x-4 -top-6 bottom-0 -z-10 overflow-hidden">
            <motion.div style={{ x: glowX, y: glowY }} className="absolute left-[8%] top-2 w-56 h-56 sm:w-72 sm:h-72">
              <motion.div {...breathe(9)} className="w-full h-full rounded-full bg-emerald-500/20 blur-3xl" />
            </motion.div>
            <motion.div style={{ x: counterX, y: counterY }} className="absolute right-[8%] top-16 w-56 h-56 sm:w-72 sm:h-72">
              <motion.div {...breathe(11)} className="w-full h-full rounded-full bg-sky-500/20 blur-3xl" />
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur border border-slate-800 text-slate-300 text-xs font-medium"
          >
            <motion.span
              className="inline-flex"
              animate={still ? undefined : { rotate: [0, -12, 12, 0] }}
              transition={{ duration: 1.2, delay: 1, repeat: Infinity, repeatDelay: 4 }}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </motion.span>
            <span>{t.home_badge}</span>
          </motion.div>

          <motion.h1
            key={currentLang}
            variants={stagger(0.05)}
            initial="hidden"
            animate="show"
            className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight"
          >
            {t.home_title.split(' ').map((word, i) => (
              <React.Fragment key={i}>
                <motion.span variants={titleWord} className="inline-block">
                  {word}
                </motion.span>{' '}
              </React.Fragment>
            ))}
          </motion.h1>

          <motion.p variants={fadeUp} className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {t.home_subtitle}
          </motion.p>

          <motion.div variants={fadeUp} className="pt-1 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-500">{t.landing_lang_label}</span>
            <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800">
              {LANGUAGES.map(({ id, label }) => (
                <motion.button
                  key={id}
                  type="button"
                  onClick={() => onLanguageChange(id)}
                  whileTap={{ scale: 0.94 }}
                  aria-pressed={currentLang === id}
                  className={`relative px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    currentLang === id ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {currentLang === id && (
                    <motion.span
                      layoutId="home-language-pill"
                      className="absolute inset-0 rounded-lg bg-emerald-600 shadow-sm"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="relative">{label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.section>

        {/* Category picker */}
        <section className="space-y-6" aria-labelledby="category-heading">
          <motion.div
            className="text-center space-y-1.5"
            variants={stagger(0.08)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.6 }}
          >
            <motion.h2 variants={fadeUp} id="category-heading" className="text-2xl sm:text-3xl font-bold text-white">
              {t.home_choose_heading}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              {t.home_choose_sub}
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger(0.12, 0.35)}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto"
          >
            {CATEGORY_LIST.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                currentLang={currentLang}
                t={t}
                still={still}
                onSelect={onSelectCategory}
              />
            ))}
          </motion.div>
        </section>

        {/* How it works */}
        <section className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-center text-2xl sm:text-3xl font-bold text-white">{t.home_how_heading}</h2>
            <motion.div
              aria-hidden
              className="mx-auto h-0.5 w-24 origin-left rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE }}
            />
          </div>
          <motion.ol
            variants={stagger(0.12)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {STEPS.map(({ icon: Icon, title, desc }, index) => (
              <motion.li
                key={title}
                variants={step}
                whileHover={{ y: -4 }}
                className="group bg-slate-900/90 border border-slate-800 hover:border-emerald-800 transition-colors p-5 rounded-2xl space-y-2"
              >
                <div className="flex items-center space-x-2.5">
                  <motion.span
                    variants={stepBadge}
                    className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center justify-center"
                  >
                    {index + 1}
                  </motion.span>
                  <Icon className="w-4 h-4 text-emerald-400 transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6" />
                </div>
                <h3 className="text-sm font-bold text-white">{t[title]}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{t[desc]}</p>
              </motion.li>
            ))}
          </motion.ol>
        </section>
      </div>
    </MotionConfig>
  );
};
