# Smart Campus Mobility: A Pilot Study of Ride-Sharing Adoption in Iraqi Universities

---

**Research Proposal**

**Principal Investigator:** Dr. Ali Al Ghanimi
Assistant Professor, Department of Control Systems and Robotics
Faculty of Engineering, University of Kufa, Najaf, Iraq
Email: ali.alghanimi@uokufa.edu.iq

**Date:** March 2026

---

## 1. Background and Motivation

Urban transportation in Iraqi cities faces persistent challenges: chronic traffic congestion, limited public transit infrastructure, rising fuel costs, and a lack of integrated mobility solutions. University campuses in Iraq, which serve tens of thousands of commuting students daily, represent a microcosm of these broader problems. Most students rely on private vehicles, informal taxis, or inconsistent minibus routes, resulting in long commute times, high costs, and significant environmental impact.

Ride-sharing platforms have transformed urban mobility worldwide. Empirical studies from the United States, Europe, China, and Southeast Asia have demonstrated that peer-to-peer ride-sharing can reduce vehicle kilometers traveled by 30--50%, lower commuting costs by 20--40%, and improve access to employment and education for underserved populations (Shaheen et al., 2016; Tirachini, 2020; Mouratidis et al., 2021). However, a critical gap persists in the literature: **there are zero peer-reviewed studies examining ride-sharing adoption in Iraq or comparable conflict-affected Middle Eastern contexts.** The socio-cultural factors that govern adoption in Iraq---including gender norms around mixed-gender travel, trust deficits in peer-to-peer transactions, cash-dominant economies, and security concerns---are fundamentally different from those studied in Western and East Asian settings.

**Toosila** is a fully developed, deployment-ready ride-sharing application specifically designed for Iraqi users. The platform incorporates culturally appropriate features such as gender-preference matching, family-member tracking, and integration with local payment norms. By piloting Toosila within the controlled environment of a university campus, this study aims to generate the first empirical evidence on ride-sharing adoption barriers and enablers in Iraq, contributing to both the transportation science literature and evidence-based mobility policy for Iraqi institutions.

## 2. Research Questions

This study addresses the following research questions:

- **RQ1:** What are the primary barriers to ride-sharing adoption among Iraqi university students, and how do they differ from barriers reported in Western and East Asian contexts?
- **RQ2:** How does interpersonal trust---both in co-riders and in the platform itself---evolve over the course of a six-week ride-sharing pilot, and what factors predict trust formation?
- **RQ3:** To what extent do gender, faculty affiliation, and commute distance moderate willingness to adopt ride-sharing, and do gender-preference matching features mitigate adoption resistance?
- **RQ4:** What are the measurable cost and time savings achieved by active ride-sharing participants compared to their pre-pilot commuting behavior and compared to a waitlist control group?

## 3. Methodology

### 3.1 Study Design

A quasi-experimental pre-post design with a waitlist control group will be employed. Participants will be randomly assigned to either the **treatment group** (immediate access to Toosila) or the **control group** (waitlisted for six weeks, then granted access). This design allows causal inference about the effects of ride-sharing access on commuting behavior, cost, and attitudes.

### 3.2 Participant Recruitment

A minimum of **500 students** will be recruited from the Faculties of Engineering and Computer Science at the University of Kufa. Recruitment will proceed through:

- In-class announcements during regularly scheduled lectures (with instructor permission).
- QR-code posters placed in faculty buildings, cafeterias, and student common areas.
- Social media announcements on official university and departmental channels.

Eligibility criteria: (a) currently enrolled undergraduate or graduate student, (b) commutes to campus at least three days per week, (c) owns a smartphone capable of running the Toosila application. Participants will provide informed consent and may withdraw at any time without academic penalty.

### 3.3 Pre-Survey Instrument

Prior to the pilot period, all participants will complete a structured pre-survey capturing:

| Construct | Items | Scale |
|-----------|-------|-------|
| Current commute mode | Single choice (private car, taxi, minibus, walking, other) | Categorical |
| Daily commute cost (IQD) | Open numeric | Continuous |
| Daily commute time (minutes, one-way) | Open numeric | Continuous |
| Willingness to share rides | 5 items | 7-point Likert |
| Interpersonal trust | Adapted from Gefen et al. (2003), 6 items | 7-point Likert |
| Platform trust | Adapted from McKnight et al. (2002), 5 items | 7-point Likert |
| Gender comfort in shared transport | 4 items | 7-point Likert |
| Technology readiness | Adapted from Parasuraman & Colby (2015), 8 items | 7-point Likert |

The survey will be administered in Arabic with back-translation validation.

### 3.4 Six-Week Pilot Period

Treatment-group participants will use the Toosila app for daily commuting over six weeks. The app will passively collect:

- Trip frequency, origin-destination pairs (anonymized to grid cells), and timestamps.
- Match rates (ride offers vs. ride requests fulfilled).
- In-app ratings and feedback.
- Feature usage logs (e.g., gender-preference filter activation, route deviation acceptance).

No GPS tracking data will be stored beyond anonymized grid-cell aggregation. Control-group participants will continue their normal commuting routines and complete weekly one-item commute-cost logs.

### 3.5 Post-Survey Instrument

After the six-week pilot, all participants will complete a post-survey including:

- Repeated measures from the pre-survey (commute cost, time, trust scales) to assess change.
- System Usability Scale (SUS) -- 10 items (treatment group only).
- Net Promoter Score (NPS) -- single item.
- Satisfaction with ride-sharing experience -- 6 items, 7-point Likert.
- Open-ended: perceived barriers, suggestions for improvement.
- Willingness to continue using ride-sharing post-study -- single item, 7-point Likert.

### 3.6 Analysis Plan

Quantitative analyses will include paired t-tests and mixed-effects models (group x time) for pre-post comparisons, structural equation modeling (SEM) for trust evolution pathways, and moderation analyses for gender and faculty effects. Qualitative responses will be analyzed using thematic analysis (Braun & Clarke, 2006). Effect sizes (Cohen's d) and confidence intervals will be reported throughout.

## 4. Data Collection and Privacy

All study procedures will be submitted for approval to the University of Kufa Research Ethics Committee prior to data collection. The following safeguards will be implemented:

- **Anonymization:** All participant data will be de-identified upon collection. A unique study ID will replace names and student numbers. The linking key will be stored on an encrypted, air-gapped device accessible only to the PI.
- **Location privacy:** GPS coordinates will be aggregated to 500m grid cells before storage. Raw GPS traces will not be retained.
- **Data storage:** Survey data will be stored on university-hosted servers. In-app behavioral data will be stored on encrypted cloud infrastructure with access restricted to the research team.
- **Informed consent:** Participants will receive a bilingual (Arabic/English) consent form detailing data collection scope, storage duration (3 years post-publication), and their right to withdraw and request data deletion.
- **Compliance:** The study will comply with Iraqi Ministry of Higher Education research guidelines and align with the principles of the Declaration of Helsinki.

## 5. Expected Outcomes

1. **First empirical dataset** on ride-sharing adoption in Iraq, filling a significant gap in the transportation literature for conflict-affected developing countries.
2. **Identification of adoption barriers** specific to the Iraqi context (trust, gender norms, security, payment preferences), enabling culturally informed platform design.
3. **Quantified cost and time savings** for ride-sharing participants, providing evidence for university administration to support campus mobility programs.
4. **Trust evolution model** demonstrating how repeated positive interactions change trust toward peer-to-peer mobility in low-trust environments.
5. **Policy recommendations** for Iraqi universities considering subsidized or institutionally supported ride-sharing programs.

## 6. Timeline

| Phase | Duration | Activities |
|-------|----------|------------|
| Phase 1: Preparation | Weeks 1--3 | Ethics approval, survey instrument validation, recruitment materials, app final testing |
| Phase 2: Recruitment and Pre-Survey | Weeks 4--5 | Participant enrollment, consent collection, pre-survey administration, randomization |
| Phase 3: Pilot Deployment | Weeks 6--11 | Six-week active pilot (treatment group uses Toosila), weekly check-ins, technical support |
| Phase 4: Post-Survey and Data Collection | Week 12 | Post-survey administration, data export, initial data cleaning |
| Phase 5: Analysis and Writing | Weeks 13--20 | Statistical analysis, manuscript preparation, submission |

**Total active study duration: 12 weeks.** Manuscript preparation extends to week 20.

## 7. Budget

Since the Toosila application is already fully developed and deployed, the budget requirements for this pilot are minimal:

| Item | Estimated Cost (USD) |
|------|---------------------|
| Cloud hosting and server costs (3 months) | 150 |
| Printed recruitment materials (posters, flyers) | 100 |
| Survey platform subscription (Arabic-compatible) | 0 (Google Forms) |
| Participant incentives (mobile data top-ups for 500 students) | 1,000 |
| Research assistant (1 RA, part-time, 12 weeks) | 600 |
| Contingency (10%) | 185 |
| **Total** | **2,035** |

The minimal budget is a direct consequence of the app being pre-built. No software development costs are required.

## 8. Target Journals for Publication

The following journals are identified as suitable publication venues, listed by relevance and impact:

1. **Transportation Research Part A: Policy and Practice** (IF ~6.3) -- ideal for adoption and policy findings.
2. **Travel Behaviour and Society** (IF ~5.2) -- focus on behavioral aspects of ride-sharing in developing countries.
3. **Journal of Transport Geography** (IF ~5.7) -- spatial analysis of campus ride-sharing patterns.
4. **Sustainable Cities and Society** (IF ~10.5) -- sustainability and smart campus mobility angle.
5. **International Journal of Transportation Science and Technology** (IF ~3.4) -- applied transportation technology, open access.
6. **Case Studies on Transport Policy** (IF ~2.8) -- suitable for a focused campus pilot case study if a shorter paper is preferred.

A secondary publication targeting a regional conference (e.g., IEEE International Conference on Intelligent Transportation Systems) is also planned to disseminate preliminary results.

## References

- Braun, V., & Clarke, V. (2006). Using thematic analysis in psychology. *Qualitative Research in Psychology*, 3(2), 77--101.
- Gefen, D., Karahanna, E., & Straub, D. W. (2003). Trust and TAM in online shopping. *MIS Quarterly*, 27(1), 51--90.
- McKnight, D. H., Choudhury, V., & Kacmar, C. (2002). Developing and validating trust measures for e-commerce. *Information Systems Research*, 13(3), 334--359.
- Mouratidis, K., Peters, S., & van Wee, B. (2021). Transportation technologies, sharing economy, and teleactivities. *Transportation Research Part D*, 92, 102716.
- Parasuraman, A., & Colby, C. L. (2015). An updated and streamlined technology readiness index. *Journal of Service Research*, 18(1), 59--74.
- Shaheen, S., Chan, N., Bansal, A., & Cohen, A. (2016). Shared mobility: Definitions, industry developments, and early understanding. *UC Berkeley Transportation Sustainability Research Center*.
- Tirachini, A. (2020). Ride-hailing, travel behaviour and sustainable mobility. *Transportation*, 47, 2011--2047.

---

*Prepared by Dr. Ali Al Ghanimi, University of Kufa, March 2026.*
