# SkillSwap 2.0 Design

SkillSwap 2.0 is a public, local-first GitHub Pages demo for 18–30 year-old learners. It combines an efficient skill marketplace with lightweight learning social features. The complete path is square → trial account → onboarding → explainable matching → exchange request → chat and scheduling → browser classroom → assignments, notes, and progress posts.

The application remains a dependency-free static site. Hash routes prevent GitHub Pages refresh failures. JSON state is stored under `skillswap.v2` in localStorage; uploaded proof blobs use IndexedDB. Seed profiles and deterministic partner replies make the full flow repeatable without a backend.

The matching score totals 100: learning hit 35, reciprocity 25, availability 15, level fit 10, mode/location 5, proof 5, reliability 5. Reciprocity at least 15 produces a direct swap; otherwise a learning hit of at least 21 produces a skill-hours match. Every result exposes the score breakdown and the selected skill pair.

Navigation: 技能广场、配对雷达、交换旅程、搭子信箱、共学空间、同学圈、成长档案. The sidebar starts with `＋ 发起交换`; mobile uses bottom navigation. UI copy remains readable at 14px minimum for controls and card details, 15–16px for body text.

