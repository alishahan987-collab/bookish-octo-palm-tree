# GLP-1–based therapies and alcohol: registry and literature gap analysis

**Search date:** 23 November 2026
**Purpose:** find a research question that a new evidence synthesis could answer without duplicating work that is already published or registered.
**Data files:** `data/registered_reviews.csv`, `data/published_reviews.csv`, `data/preclinical_candidate_studies.csv`, `data/human_subgroup_feasibility.csv`, `data/search_log.csv`

---

## 1. Bottom line

1. **The clinical question is saturated.**
   - I found **77 registered reviews** on GLP-1–based drugs and alcohol or addiction: 63 in PROSPERO, 14 on OSF, none on INPLASY and none in Research Registry.
   - **36 of them focus on alcohol.** Three were registered in 2024, 16 in 2025 and 17 so far in 2026.
   - **Eight RCT-only meta-analyses of alcohol outcomes were registered in 2026 alone.**
   - Only 7 of the 77 registrations can be matched to a publication. Many near-identical RCT meta-analyses are therefore still to come.
2. **Every clinical topic considered in this project is already registered.** These include an RCT-only meta-analysis that includes dual agonists, a semaglutide-only meta-analysis, BMI as a moderator, a network meta-analysis against approved AUD drugs, cohort studies of AUD risk, liver outcomes, and co-agonists across substance use disorders. See Table 2.
3. **Four evidence-synthesis gaps remain.** In ranked order:
   1. **A translational meta-analysis of animal studies of GLP-1–based agonists and alcohol behaviour.** No meta-analysis exists. About 33 eligible papers have been found so far. The one registered animal review plans a narrative synthesis only.
   2. **A meta-research study of duplication and research waste in this field.** Most of the data is already collected in this project. A related OSF reproducibility audit (osf.io/vy74r) is the project to coordinate with or differentiate from.
   3. **An individual participant data (IPD) meta-analysis of the AUD RCTs.** It has the highest clinical value. Feasibility depends on persuading trial teams and companies to share data.
   4. **A scoping review of GLP-1–alcohol interactions and safety in people who drink.** It would cover blood alcohol and pharmacokinetics, pancreatitis, hypoglycaemia, Wernicke's encephalopathy and thiamine, and forensic implications for blood alcohol. Evidence is sparse and varied, so a scoping review fits better than a meta-analysis.
4. **Recommendation:**
   - **Register Gap 1** as the meta-analysis.
   - Run **Gap 2** as a quick companion paper.
   - Pursue **Gap 3** only if data-sharing partners can be secured.
   - Do **not** register another clinical RCT meta-analysis.
   - **If the review must use human studies only, see Section 1A.**

---

## 1A. If the review must use human studies only

I tested five more human candidates against PubMed and PROSPERO on 23 Nov 2026.

| Candidate | Human evidence | Registered overlap | Verdict |
|---|---|---|---|
| Change in drinking among everyday GLP-1 users without AUD | ~8 studies since mid-2025 | CRD420261384676 includes "adults defined by GLP-1RA exposure in any clinical context" and observational designs; CRD420251182640 covers people with obesity | **Taken** |
| GLP-1 vs naltrexone or acamprosate in real-world data | 3 studies | The network meta-analysis of RCTs is already registered (CRD420261492273) | Too thin |
| MetALD (fatty liver disease plus moderate drinking) | No primary human studies | None | Needs primary research first |
| Effect modification by drug, T2D vs obesity, AUD severity or comparator | ~25 real-world studies + 5 RCTs | CRD420261384676 pre-specifies these subgroups; CRD420261558272 covers BMI | **Taken** |
| **Effect modification by sex (and age)** | Sex-stratified results in **9 of the 16 full texts I could read** (6 real-world studies, 3 RCTs); age-stratified results in 8 of the 30 papers checked | **None registered with this aim.** CRD420251006597 (sex differences) covers only people with psychiatric diagnoses and **excludes observational and cohort studies**. CRD420261384676 does not list sex as a subgroup. | **Open** |

### Recommended human topic

**Working title:** *Do women and men benefit equally? Sex differences in the effects of GLP-1–based therapies on alcohol outcomes: a systematic review and meta-analysis of within-study sex-stratified estimates.*

**Why it matters:**
- AUD treatment trials have historically enrolled mostly men.
- Women and men differ in how they absorb and process alcohol.
- An animal study found that the GLP-1 agonist exendin-4 affected alcohol reinforcement differently in male and female mice (PMID 37106129).
- No published or registered review answers whether the benefit of GLP-1 drugs on drinking differs by sex.

**Design essentials:**
- **Studies:** RCTs and real-world studies (cohorts, target trial emulations) of any GLP-1–based drug that report alcohol outcomes separately for women and men, or report a sex-by-treatment interaction.
- **Outcome families:**
  1. drinking quantity (heavy drinking days, drinks, AUDIT/AUDIT-C)
  2. new or recurrent AUD
  3. alcohol-related hospital or emergency visits
  4. liver outcomes (secondary)
- **Effect measure:** a within-study ratio of effects for women vs men (for example, a ratio of hazard ratios), pooled with a random-effects model. Comparing women and men inside each study avoids the bias of comparing averages across different studies.
- **Secondary analysis:** age (≥65 vs younger), using the same method.
- **Quality and certainty:** RoB 2 for RCTs, ROBINS-I for observational studies, GRADE for certainty.
- **Author contact:** ask authors for sex-stratified results they did not publish. For example, Klausen 2026 enrolled 53 women and 55 men but did not show sex-specific results in its abstract.

**Feasibility:**
- About 9 studies with sex-stratified results were found in freely available full texts. The 14 paywalled papers may add more.
- Every "yes" in `data/human_subgroup_feasibility.csv` came from text matching and needs a manual check.
- Expect about 3–5 months with two reviewers.

**Risks:**
- There may be only 4–8 studies per outcome family, which would give imprecise estimates.
- One of the broad registered reviews could add a sex subgroup later, so register quickly.

**Runner-up (human): IPD meta-analysis of the AUD RCTs (Gap 3).** This is the strongest way to answer the sex question. Data-sharing statements exist for Probst 2023 (data "available upon reasonable request"), Hendershot 2025 (statement in Supplement 3) and Klausen 2022. None was found in the Schacht 2026 text. Klausen 2026 could not be checked because it has no free full text.

**Quick human alternatives:**
- The scoping review of interactions and safety in people who drink (Gap 4).
- A pharmacovigilance study (FAERS or VigiBase) of alcohol-related adverse-event reports with GLP-1–based drugs. This uses public human data but is primary research, not a meta-analysis.

---

## 2. What was searched

| Source | Method | Result |
|---|---|---|
| **PROSPERO** | Website search run through a headless browser: 7 main queries and 14 queries for specific gap ideas, with Boolean, truncation and field codes. Withdrawn records (`withdrawn:es`) and living reviews (`living:il`) were also searched. I read the **full records of the 20 closest overlaps**. | 63 relevant registrations. No withdrawn registrations matched. No living review covers alcohol. |
| **INPLASY** | Site search with 10 drug terms and 8 alcohol/addiction terms. I screened 92 protocol pages and 8 monthly listing pages. | **0** relevant |
| **OSF Registries** | SHARE search API, registrations only. 42 queries combining a drug term with a topic term. | 14 relevant reviews, plus 6 primary-study preregistrations |
| **Research Registry** | Browse/search interface with 5 drug terms | **0** relevant (2 unrelated GLP-1 reviews) |
| **PubMed** | E-utilities: 27 searches by domain, one per evidence area, plus an animal search that includes exendin-4 and 3 targeted checks | Counts and titles in `search_log.csv` |
| **Europe PMC** | Includes medRxiv, bioRxiv, Research Square, PsyArXiv and Preprints.org | 39 preprints screened. **No** animal meta-analysis. |
| **OpenAlex** | Check for an existing animal meta-analysis | None found |
| **ClinicalTrials.gov** | Previous session: 25 interventional GLP-1-class trials in AUD | 6 completed trials have no peer-reviewed results |

**Not searched:**
- Embase, Scopus, Web of Science, PsycINFO and CENTRAL (no access from this environment).
- The Cochrane Library and ANZCTR, which returned 403 errors.
- WHO ICTRP, which was reachable but not queried.

A formal protocol search must add Embase, Web of Science and Scopus.

---

## 3. Registry landscape

**Table 1. Registered reviews by focus.** The full list, with links, is in `registered_reviews.csv`.

| Focus | n | Notes |
|---|---|---|
| Alcohol (clinical, including 1 review of alcohol + tobacco) | 35 | With the obesity review below, 36 focus on alcohol: 3 in 2024 → 16 in 2025 → 17 in 2026 |
| Alcohol intake in people with obesity | 1 | CRD420251182640 |
| Substance use disorders in general (includes alcohol) | 28 | Includes 1 animal review (CRD420261428113) |
| Nicotine or smoking | 8 | Includes 1 animal review |
| Opioids, stimulants or cannabis | 5 | |
| **Total** | **77** | 41 registered in 2026 alone (about one a week) |

PROSPERO marks 60 of its 63 records as "Ongoing", but that status is often out of date. I matched 7 registrations to publications: Subhani 2024, de Faria Moraes 2025, Eshraghi 2025, Sinha 2025, Völker 2026, Nasrollahizadeh 2026 and Sarma 2026.

**Table 2. Clinical questions that are already registered.** Do not duplicate these.

| Question | Registered as (date) |
|---|---|
| GLP-1RA or GLP-1/GIP dual agonist vs placebo in AUD; primary outcome % heavy drinking days; RCTs only | **CRD420261517725** (15 Oct 2026) |
| Other RCT-only GLP-1 meta-analyses in AUD | CRD420261386025 (Bayesian), CRD420261420111, CRD420261534373, CRD420261557391 |
| Semaglutide-only RCT meta-analysis | CRD420261534054, CRD420261575261 (17 Nov 2026), **OSF wmvd3**. The OSF review was registered retrospectively with data extraction already done, so it is likely to be published soon. |
| BMI ≥30 as a moderator of the effect in AUD | **CRD420261558272** (31 Oct 2026) |
| Network meta-analysis vs naltrexone, acamprosate, topiramate, gabapentin and nalmefene | **CRD420261492273** (30 Aug 2026) |
| RCTs plus observational studies, including dual agonists; primary outcome % heavy drinking days | CRD420261501310, CRD420261384676 |
| Incident AUD in cohort studies (GLP-1RA vs DPP-4i/SGLT2i) | CRD420261503118 |
| GLP-1–based drugs including tirzepatide and retatrutide; treatment and prevention of substance use disorders | CRD420261521645 |
| Alcohol-related liver disease | CRD420251050088, CRD420251229635, OSF afczy (scoping review) |
| Craving | CRD420251245423, CRD420261407132 |
| Umbrella review across substance use disorders | CRD420261458085 |
| Smoking cessation | 6 registrations plus published meta-analyses |
| Opioids | CRD420261465034, OSF ywk46, a published systematic review (2025) and a published scoping review (2026) |
| Dual and triple agonists and addiction | OSF 4w3jx, OSF 5kstj (scoping reviews) |
| Reproducibility of published GLP-1 alcohol meta-analyses | **OSF vy74r** (16 Nov 2026) |

---

## 4. Evidence map by domain

| # | Domain | Primary evidence (approx.) | Existing or registered synthesis | Verdict |
|---|---|---|---|---|
| 1 | RCT efficacy in AUD | 5 published placebo-controlled RCTs (~480 participants). At least 4 completed RCTs without peer-reviewed results: mazdutide n=308, Novo Nordisk (alcohol-related liver disease) n=270, RECLAIM (topline only) ~100, STAR-T n=80 | ≥10 published systematic reviews/meta-analyses; 8 RCT-only meta-analyses registered in 2026, plus a network meta-analysis and a BMI-moderator review | **Saturated** |
| 2 | Observational alcohol outcomes: incident AUD, recurrence, hospitalisation | ≥15 cohort and target trial emulation studies, e.g. *Lancet Psychiatry* 2026, *BMJ* 2026 (veterans), *BMJ Open* 2026 | Published meta-analysis (search to Sep 2025); updates registered (CRD420261503118, CRD420261521645) | **Saturated** |
| 3 | Alcohol-related liver disease | Several cohort and target trial emulation studies | de Faria Moraes 2025; 2 PROSPERO registrations and 1 OSF registration | **Saturated** |
| 4 | Alcohol intake in obesity or T2D without AUD | ~6–8 patient-reported, AUDIT-C and post-hoc studies (*Sci Rep* 2023; *JAMA Psychiatry* 2026; *Addict Behav* 2026; All of Us 2026) | CRD420251182640 and CRD420261384676 partly cover this | Partly open; low priority |
| 5 | **Animal studies: alcohol intake, self-administration and relapse** | **~33 likely-eligible papers (2013–2027)** in rats, mice and vervet monkeys. Mono, dual and triple agonists and GLP-1 + amylin combinations. ≥5 studies test both sexes. | Systematic reviews only (2019, 2025, 2026 reward-processing review). **No meta-analysis.** CRD420261428113 plans a **narrative** synthesis only, covers 2019–2025, and excludes co-agonists. | **Open → Gap 1** |
| 6 | Human pharmacokinetics and blood alcohol interaction | 1 pilot alcohol-challenge study (*Sci Rep* 2025), 1 hepatic ethanol-metabolism study (2025), 1 forensic ignition-interlock case report (*Med Leg J* 2026) | None | **Open → Gap 4 (scoping)**; primary research needed |
| 7 | Safety in heavy drinkers: pancreatitis, hypoglycaemia, Wernicke's encephalopathy | Pancreatitis: cause-specific target trial emulation (*BMJ Med* 2026) and a recurrence cohort (2026). Wernicke's: systematic review (2026) and pharmacovigilance study (2026). Nothing AUD-specific. | None AUD-specific | **Open → Gap 4**; AUD-specific primary data needed |
| 8 | Pharmacovigilance of alcohol-related adverse-event reports | None found | None | **Primary gap** |
| 9 | Genetics and Mendelian randomisation | GLP1R/GIPR drug-target MR (*Mol Psychiatry* 2025), MR for mental illness (2025), ~3 candidate-gene studies | None | Too thin to pool. A **GCGR (glucagon-receptor) MR** has not been done and is a primary gap. |
| 10 | Neuroimaging | A handful of human studies | Brucar 2026 systematic review; 2 registrations | **Saturated** |
| 11 | Comparisons with approved AUD drugs | No head-to-head RCTs; 2–3 observational studies (*Aliment Pharmacol Ther* 2026; a Swedish registry study, 2025) | Network meta-analysis registered | Premature and already registered |
| 12 | Co-agonists: tirzepatide, retatrutide, pemvidutide, mazdutide, cagrilintide | Human RCT data limited to the RECLAIM topline release | Inside CRD420261517725 and CRD420261521645; 2 OSF scoping reviews | **Premature** |
| 13 | Nicotine, opioids, cannabis, stimulants | Varies | Multiple registered and published reviews for each | **Saturated** |
| 14 | Gambling and other behavioural addictions | Case reports (*J Clin Psychopharmacol* 2026) | None | **Primary gap** |
| 15 | Effects after stopping the drug, and durability | 1 study (*Lancet Psychiatry* 2026) | None | **Primary gap** |
| 16 | Special populations: adolescents, HIV, severe mental illness, after bariatric surgery | Adolescents: none. HIV and severe mental illness: trials ongoing. Bariatric: 3 cohorts. | None | **Primary gaps** |
| 17 | Sex differences | Humans: no sex-stratified synthesis. Animals: ≥5 studies with both sexes. | None | Addressed by Gaps 1 and 3 |
| 18 | Economic evaluation | None found | None | **Primary gap** (cost-effectiveness model) |
| 19 | Acceptability: people with AUD, clinicians, 12-step groups | 1 preprint (PsyArXiv 2026) | None | **Primary gap** (qualitative) |
| 20 | Population-level alcohol purchasing | No peer-reviewed study | None | **Primary gap** (econometric) |
| 21 | Research on the research: duplication and redundancy | No published study | OSF vy74r (reproducibility audit) | **Open → Gap 2** |

---

## 5. Ranked evidence-synthesis gaps

Scores run from 1 (worst) to 5 (best).

| Gap | Novelty | Evidence base | Value | Feasibility | Shelf life | Total |
|---|---|---|---|---|---|---|
| **1. Translational animal meta-analysis** | 5 | 4 | 4 | 5 | 4 | **22** |
| **2. Meta-research on duplication** | 4 | 5 | 4 | 5 | 3 | **21** |
| **3. IPD meta-analysis of AUD RCTs** | 5 | 3 | 5 | 2 | 5 | **20** |
| **4. Scoping review of interactions and safety** | 4 | 2 | 4 | 4 | 4 | **18** |
| 5. Proportion meta-analysis of self-reported drinking change in non-AUD users | 2 | 3 | 3 | 4 | 3 | 15 |

### Gap 1: translational animal meta-analysis (recommended)

**Working title:** *GLP-1 receptor–based agonists and alcohol-related behaviour in animal models: a systematic review and meta-analysis with translational comparison to human trials.*

**Why it is open:**
- Three systematic reviews exist (2019, 2025, 2026), but none pools effect sizes.
- The only registered animal review (CRD420261428113) plans a narrative synthesis, has no subgroup or publication-bias plan, covers only 2019–2025, and includes only GLP-1RAs and DPP-4 inhibitors.
- No existing or registered review is quantitative. Similar animal GLP-1 meta-analyses have been published for Alzheimer's disease (2023), Parkinson's disease (2022) and beta-cell outcomes (2025), so the format is established.

**What it adds:**
- A pooled estimate across rodents and non-human primates.
- Moderator analyses by:
  - sex
  - drug class (mono vs dual vs triple agonist; amylin combinations)
  - dose
  - systemic vs brain-region-specific administration
  - acute vs chronic dosing
  - model (home-cage intake, operant self-administration, relapse, reinstatement)
- Formal tests for publication bias and small-study effects.
- A comparison of animal effect sizes with human RCT effect sizes. This tests how well the animal work predicted the human results, a known weakness of addiction pharmacology.

**Core methods:**
- Standards: SYRCLE risk of bias, ARRIVE reporting items, CAMARADES/SyRF workflow.
- Effect size: standardised mean difference (Hedges' g) in a multilevel random-effects model, with experiments nested within papers and a correction for shared control groups.
- Small-study effects: Egger-type test using a sample-size-based precision measure, plus trim-and-fill.
- Data extraction from figures: WebPlotDigitizer.
- Registration: PROSPERO (which registers animal reviews; CRD420261428113 is one) or SyRF/OSF.

**Feasibility:**
- About 33 likely-eligible papers came from PubMed titles and abstracts alone, listed in `preclinical_candidate_studies.csv`. Embase, Web of Science and bioRxiv will add more.
- Expect around 3–5 months with two reviewers.

**Risk:** CRD420261428113 overlaps in topic. Cite it, state the differences explicitly (quantitative analysis, all years, co-agonists, primates, moderators, publication bias, translational comparison), and consider contacting that team.

### Gap 2: meta-research on duplication and research waste

**Working title:** *Duplication, registration and research waste in systematic reviews of GLP-1–based therapies for alcohol and substance use: a meta-research study.*

**Why it is open:**
- There are 77 registrations and more than 20 published reviews, built on only 5 published RCTs.
- No published study documents this. Similar work exists for GLP-1 cardiology and weight loss: overlap analyses of cardioprotection reviews (2021) and atrial fibrillation meta-analyses (2026), and a 2026 review of network meta-analyses for weight loss.

**What it would measure:**
- The ratio of reviews to trials.
- The registration-to-publication rate and the time it takes.
- Differences between registered protocols and published reviews (outcome switching).
- Overlap of primary studies across reviews (corrected covered area).
- Review quality (AMSTAR-2).
- Whether reviews reach the same or contradictory conclusions, and whether they report findings with misleading emphasis ("spin").
- Whether each review cites earlier reviews.

**Feasibility:** high. Most of the sampling frame is in `registered_reviews.csv` and `published_reviews.csv`.

**Risk:** OSF vy74r (16 Nov 2026) is auditing whether published meta-analytic estimates can be reproduced. That project is complementary but nearby, so differentiate or collaborate. This topic is time-sensitive and should be submitted quickly.

### Gap 3: IPD meta-analysis of the AUD RCTs

**Why it matters:** the key clinical uncertainty is whether the effect depends on BMI, sex, severity or treatment-seeking status. The aggregate-data review CRD420261558272 cannot answer this without ecological bias; an IPD meta-analysis can.

**Sources of data:**
- 2 trials from the Copenhagen group (Klausen 2022, Klausen 2026).
- Hendershot 2025, Schacht 2026 and Probst 2023.
- Completed industry and academic trials: RECLAIM, mazdutide, the Novo Nordisk alcohol-related liver disease trial, and STAR-T.

**Feasibility:** low to medium. It needs data-sharing agreements and is likely to take 12–24 months. The first step is to send a short enquiry to each trial team and sponsor.

### Gap 4: scoping review of GLP-1–alcohol interactions and safety in people who drink

The evidence is spread thinly across different study types:
- a human alcohol-challenge pilot (*Sci Rep* 2025)
- a hepatic ethanol-metabolism study (2025)
- a forensic ignition-interlock case report (*Med Leg J* 2026)
- cause-specific pancreatitis data (*BMJ Med* 2026)
- a Wernicke's encephalopathy systematic review and a pharmacovigilance study (2026)

A scoping review following PRISMA-ScR fits this evidence; a meta-analysis does not. Clinicians and forensic practitioners would use it. There is a precedent: a 2026 PROSPERO meta-analysis of alcohol pharmacokinetics after bariatric surgery for forensic blood-alcohol calculation (CRD420261549225).

---

## 6. Primary-research gaps (not yet ready for synthesis)

| Gap | Suggested design | Speed |
|---|---|---|
| Alcohol-related adverse-event signals for GLP-1–based drugs (pancreatitis with alcohol, hypoglycaemia, intoxication, Wernicke's encephalopathy) | FAERS or VigiBase disproportionality analysis (public data) | Fast |
| GCGR and GIPR genetic proxies (relevant to glucagon co-agonists) and drinking or AUD | Drug-target Mendelian randomisation using current AUD and drinks-per-week GWAS | Fast |
| Blood alcohol over time on semaglutide or tirzepatide, and its forensic implications | Controlled alcohol-challenge crossover study | Medium |
| Pancreatitis, hypoglycaemia and Wernicke's risk in people with AUD who start GLP-1RAs | Target trial emulation in EHR data | Medium |
| Drinking after stopping the drug, and how durable the effect is | Cohort study, or follow-up after RCTs end | Medium |
| Cost-effectiveness of semaglutide for AUD with obesity | Decision model using effect sizes from Klausen 2026 | Medium |
| Acceptability among people with AUD, clinicians and 12-step groups | Qualitative or mixed-methods study | Medium |
| Gambling and other behavioural addictions | Case series, then pilot RCT | Slow |
| Adolescents and young adults; HIV; severe mental illness; after bariatric surgery | Trials and cohorts (some are ongoing) | Slow |
| Population-level alcohol purchasing as GLP-1 use rises | Econometric analysis of retail or panel data | Medium |

---

## 7. Next steps

1. **Choose Gap 1** (or Gap 1 plus Gap 2).
2. **Re-check the registries on the day you register.** In 2026, a new GLP-1 addiction review was registered about once a week (41 by 23 November), and an alcohol-focused one every 2–3 weeks.
3. Draft the Gap 1 protocol: PICO, SYRCLE, moderators, analysis plan, and the search strategy for PubMed, Embase, Web of Science, Scopus and bioRxiv. Then register it on PROSPERO.
4. If you pursue Gap 2, decide how to position it against OSF vy74r. Either contact those authors or define a clearly separate scope (registration and duplication vs reproducibility of estimates).
5. If you pursue Gap 3, send data-sharing enquiries to the trial teams and sponsors now. Sponsor approval usually takes months.

---

## 8. Confidence and limitations

- **High confidence:**
  - The scale of duplication.
  - The specific overlapping registrations in Table 2; I read the full records of all 20.
  - The absence of any animal meta-analysis, checked across PubMed, Europe PMC (including preprints), OpenAlex and PROSPERO.
- **Moderate confidence:**
  - The registration counts. These classifications come from titles; only the 20 closest PROSPERO records and the key OSF records were checked in full. Registrations made after 23 Nov 2026 are not included.
  - The number of eligible animal studies (~33). This comes from PubMed titles and abstracts; a full multi-database search will change it, probably upward.
- **Not covered:** Embase, Scopus, Web of Science, PsycINFO, CENTRAL, the Cochrane Library (blocked), WHO ICTRP, and conference abstracts.
- **Corrections to earlier work in this project:**
  - The first overlap report found 14 reviews and 7 registrations; the true number of registrations is 77.
  - The "living RCT meta-analysis including co-agonists" recommended earlier is now largely covered by CRD420261517725 and CRD420261521645, and by 2 OSF scoping reviews.

---

## Key references (bibliographic data from PubMed)

- Klausen 2026, *Lancet*. https://doi.org/10.1016/S0140-6736(26)00305-3
- Schacht 2026, *Am J Psychiatry*. https://doi.org/10.1176/appi.ajp.20260003
- Hendershot 2025, *JAMA Psychiatry*. https://doi.org/10.1001/jamapsychiatry.2024.4789
- Klausen 2022, *JCI Insight*. https://doi.org/10.1172/jci.insight.159863
- Probst 2023, *JCI Insight*. https://doi.org/10.1172/jci.insight.170419
- Animal reward-processing systematic review, *Acta Neuropsychiatr* 2026. https://doi.org/10.1017/neu.2026.10097
- Alcohol-challenge pilot study, *Sci Rep* 2025. https://doi.org/10.1038/s41598-025-17927-w
- Hepatic ethanol metabolism, *NPJ Metab Health Dis* 2025. https://doi.org/10.1038/s44324-025-00077-y
- Ignition-interlock case report, *Med Leg J* 2026. https://doi.org/10.1177/00258172261476035
- Cause-specific pancreatitis target trial emulation, *BMJ Med* 2026. https://doi.org/10.1136/bmjmed-2025-002183
- Wernicke's encephalopathy systematic review, *Obesity* 2026. https://doi.org/10.1002/oby.70256
- Wernicke's pharmacovigilance study, *Clin Nutr* 2026. https://doi.org/10.1016/j.clnu.2025.106571
- GLP1R/GIPR drug-target MR, *Mol Psychiatry* 2025. https://doi.org/10.1038/s41380-025-03199-3
- AUD and SUD admissions during and after treatment, *Lancet Psychiatry* 2026. https://doi.org/10.1016/S2215-0366(26)00172-0
- GLP-1RAs vs FDA-approved AUD medications, *Aliment Pharmacol Ther* 2026. https://doi.org/10.1111/apt.70596
- Patient-reported changes in alcohol use, *JAMA Psychiatry* 2026. https://doi.org/10.1001/jamapsychiatry.2026.3242
- Gambling disorder and semaglutide, *J Clin Psychopharmacol* 2026. https://doi.org/10.1097/JCP.0000000000002117
- Psychiatric incretin RCT landscape, *J Psychiatr Res* 2026. https://doi.org/10.1016/j.jpsychires.2026.10.039
- Incretin mimetics and alcohol outcomes (narrative review), *Pharmacotherapy* 2026. https://doi.org/10.1002/phar.70206
