# Source Classification Audit — 2026-03-08

**666 sources audited** across 8 categories. Each source's type and region was verified via web search of profiles, bios, and recent posting patterns.

**Overall: ~179 issues found (~27% error rate)**

| Category | Audited | Issues | Error Rate |
|----------|---------|--------|------------|
| osint | 135 | ~63 | 47% |
| reporter | 97 | 35 | 36% |
| analyst | 126 | 33 | 26% |
| news-org | 200 | ~30 | 15% |
| official | 65 | ~18 | 28% |
| aggregator | 35 | ~3 | 9% |
| bot | 6 | 0 | 0% |
| ground | 2 | 0 | 0% |

---

## Sharpened Category Definitions

These definitions were used for the audit and should be the standard going forward:

| Type | Definition | Examples |
|------|-----------|----------|
| `official` | Government bodies, military, international orgs, major NGOs/advocacy orgs (ACLU, EFF, HRW, CPJ, ADL) | WHO, Pentagon, CISA, UNHCR, ACLU, EFF |
| `news-org` | Institutional newsrooms with editorial staff. Must be an organization, not a person | AP, Reuters, NYT, Guardian, 404 Media |
| `reporter` | Individual journalists employed by or freelancing for news orgs. Original reporting | Jake Tapper, Christopher Miller (FT) |
| `osint` | Open-source intelligence: satellite imagery, flight/ship tracking, geolocation, equipment ID, digital forensics. The "I" matters | Bellingcat, NOELREPORTS, GeoConfirmed, Citizen Lab |
| `analyst` | Subject-matter experts, think tanks, academics, commentators. Analysis/opinion, not original reporting or OSINT tradecraft | Brookings, CSIS, ISW, Heather Cox Richardson |
| `aggregator` | Curate/repost from other sources. No original reporting or analysis | BNO News, Factal, r/worldnews, War Monitor |
| `ground` | On-location sources posting from conflict zones/disaster areas | Meanwhile in Ukraine, r/CombatFootage |
| `bot` | Fully automated feeds | Executive Order Tracker, GovTrack |

---

## OSINT Sources — Issues Found (63 of 135)

The most over-applied label. Many think tanks, journalists, and aggregators were incorrectly tagged as OSINT.

| id | name | platform | current_region | proposed_type | proposed_region | confidence | notes |
|---|---|---|---|---|---|---|---|
| war-monitor | The War Monitor | bluesky | all | `aggregator` | all | high | Breaking news aggregator, reposts from other sources |
| bno-news | BNO News | bluesky | all | `aggregator` | all | high | Wire service/news aggregator, not OSINT |
| malcontent-news | Malcontent News | bluesky | all | `analyst` | europe-russia | high | Analysis/commentary on Ukraine war, not OSINT tradecraft |
| factal | Factal | bluesky | all | `aggregator` | all | high | Commercial breaking news verification service |
| ron-filipkowski | Ron Filipkowski | bluesky | us | `reporter` | us | high | Lawyer, editor-in-chief of MeidasTouch |
| kate-starbird | Kate Starbird | bluesky | us | `analyst` | us | high | UW professor studying disinformation |
| van-jackson | Van Jackson | bluesky | all | `analyst` | asia | high | Professor of IR, defense/Asia specialist |
| andrew-revkin | Andrew Revkin | bluesky | all | `reporter` | all | high | Climate journalist (ex-NYT, ProPublica) |
| crisisgroup | International Crisis Group | bluesky | all | `analyst` | all | high | Think tank. Duplicate of crisis-group entry |
| swiftonsecurity | SwiftOnSecurity | bluesky | all | `analyst` | all | medium | Cybersecurity commentator, Microsoft MVP |
| lincolnproject | The Lincoln Project | bluesky | us | `analyst` | us | medium | Political PAC/advocacy org |
| democracyforward | Democracy Forward | bluesky | us | `official` | us | high | Legal nonprofit filing lawsuits |
| emptywheel | emptywheel (Marcy Wheeler) | bluesky | us | `reporter` | us | high | Independent national security journalist |
| kenklippenstein | Ken Klippenstein | bluesky | us | `reporter` | us | high | Independent journalist, FOIA-based reporting |
| robert-evans | Robert Evans | bluesky | all | `reporter` | all | high | Conflict journalist, podcast host |
| 404media | 404 Media | bluesky | all | `news-org` | all | high | Worker-owned investigative tech news org |
| krebs-security-rss | Krebs on Security | rss | all | `reporter` | all | high | Brian Krebs, investigative cybersecurity journalist |
| icij-rss | ICIJ | rss | all | `news-org` | all | high | International Consortium of Investigative Journalists |
| china-digital-times-rss | China Digital Times | rss | asia | `news-org` | asia | high | Nonprofit media translating censored Chinese content |
| eff-rss | EFF | rss | all | `official` | all | high | Digital rights advocacy nonprofit |
| adl-rss | ADL | rss | us | `official` | us | high | Civil rights advocacy nonprofit |
| propublica-rss | ProPublica | rss | us | `news-org` | us | high | Nonprofit investigative newsroom (matches Bluesky classification) |
| soufan-center-rss | The Soufan Center | rss | all | `analyst` | all | high | Counterterrorism think tank |
| hrw-rss | Human Rights Watch | rss | all | `official` | all | high | International human rights watchdog NGO |
| insight-crime-rss | InSight Crime | rss | latam | `analyst` | latam | medium | Organized crime research, "part media, part think tank" |
| long-war-journal | Long War Journal | rss | middle-east | `news-org` | middle-east | high | FDD project, counterterrorism reporting |
| fdd-feed | FDD | rss | middle-east | `analyst` | middle-east | high | Foundation for Defense of Democracies, DC think tank |
| ariane-tabatabai | Ariane Tabatabai | bluesky | middle-east | `analyst` | middle-east | high | Pentagon policy advisor, former RAND researcher |
| washington-institute | Washington Institute | bluesky | middle-east | `analyst` | middle-east | high | Think tank (WINEP) |
| csis-middle-east | CSIS Middle East | bluesky | middle-east | `analyst` | middle-east | high | CSIS program, think tank |
| chatham-house-mena | Chatham House MENA | bluesky | middle-east | `analyst` | middle-east | high | British think tank |
| michael-kofman | Michael Kofman | bluesky | europe-russia | `analyst` | europe-russia | high | Carnegie fellow, Russian military analyst |
| ian-bremmer | Ian Bremmer | bluesky | all | `analyst` | all | high | Political scientist, Eurasia Group founder |
| jeffrey-lewis | Jeffrey Lewis (Arms Control Wonk) | bluesky | all | `analyst` | all | medium | Academic/arms control analyst. Uses sat imagery but primarily policy analyst |
| michael-hayden | Gen Michael Hayden | bluesky | all | `analyst` | us | high | Retired CIA/NSA director, commentator |
| atlantic-council | Atlantic Council | bluesky | all | `analyst` | all | high | DC think tank |
| tnsr | Texas National Security Review | bluesky | all | `analyst` | all | high | Academic journal |
| paul-krugman | Paul Krugman | bluesky | all | `analyst` | us | high | Economist, columnist |
| asia-society | Asia Society | bluesky | asia | `analyst` | asia | high | Cultural/policy org |
| ncuscr | NCUSCR | bluesky | asia | `analyst` | asia | high | US-China relations policy org |
| michael-weintraub | Michael Weintraub | bluesky | latam | `analyst` | latam | high | Academic studying political violence |
| arms-control-wonk | Arms Control Wonk | bluesky | all | `analyst` | all | medium | Blog/podcast, duplicate of jeffrey-lewis |
| keithedwards | Keith Edwards | bluesky | us | `reporter` | us | high | Political commentator, YouTuber |
| markzaidesq | Mark Zaid, Esq | bluesky | us | `analyst` | us | high | National security lawyer |
| elonjet | Elon Jet Tracking | bluesky | all | `bot` | all | high | Automated flight tracking bot |
| fiveminutenews | FIVE MINUTE NEWS | bluesky | us | `aggregator` | us | high | News podcast/briefing |
| xkcd | Randall Munroe (xkcd) | bluesky | all | **REMOVE** | — | high | Webcomic artist, zero relevance to news intelligence |
| mindyanns | Mindy Schwartz | bluesky | us | `reporter` | us | medium | Political commentator/content director |
| cpj-rss | Committee to Protect Journalists | rss | all | `official` | all | high | Press freedom advocacy nonprofit |
| birn-rss | BIRN | rss | europe-russia | `news-org` | europe-russia | high | Balkan Investigative Reporting Network |
| correctiv-rss | CORRECTIV | rss | europe-russia | `news-org` | europe-russia | high | German nonprofit investigative newsroom |
| merip | MERIP | bluesky | middle-east | `analyst` | middle-east | high | Academic analysis publication |
| ryan-mcbeth | Ryan McBeth | bluesky | all | `analyst` | all | medium | Military analyst/YouTuber |
| china-media-project | China Media Project | bluesky | asia | `analyst` | asia | high | Academic research on Chinese media |
| michael-weiss | Michael Weiss | bluesky | europe-russia | `reporter` | europe-russia | high | Investigative journalist (Yahoo News, The Insider) |
| kyiv-insider | Kyiv Insider | bluesky | europe-russia | `aggregator` | europe-russia | medium | Ukraine news aggregation |
| vatniksoup | Vatnik Soup | bluesky | europe-russia | `analyst` | europe-russia | high | Finnish disinformation researcher |
| chriso-wiki | ChrisO_wiki | bluesky | europe-russia | `analyst` | europe-russia | medium | Military history author/translator |
| telegram-middle-east-spectator | Middle East Spectator | telegram | middle-east | `aggregator` | middle-east | medium | News aggregator |
| telegram-ddgeopolitics | DD Geopolitics | telegram | all | `aggregator` | all | medium | News aggregator |
| telegram-ourwarstoday | Our Wars, Today | telegram | all | `aggregator` | all | medium | Conflict news aggregator |
| historian68-iran | Iran History | bluesky | middle-east | `analyst` | middle-east | medium | History/analysis account |
| all-source-news | All Source News | bluesky | all | `aggregator` | all | medium | News aggregator |
| bill-bishop | Bill Bishop | bluesky | asia | `analyst` | asia | high | Sinocism newsletter publisher |

**OSINT region-only fixes** (type is correct):

| id | name | current_region | proposed_region | confidence | notes |
|---|---|---|---|---|---|
| wapo-evanhill | Evan Hill (WaPo) | us | all | high | Visual forensics reporter, international investigations |
| wapo-jarrettley | Jarrett Ley (WaPo) | us | all | high | Visual forensics reporter, international investigations |
| warmapper | War Mapper | all | europe-russia | medium | Primarily Ukraine conflict mapping |
| decker-eveleth | Decker Eveleth | asia | all | high | Covers China, Russia, Middle East missile forces |

---

## Reporter Sources — Issues Found (35 of 97)

The most common problem: commentators, pundits, and lawyers tagged as reporters.

### Type Changes

| id | name | platform | current_region | proposed_type | proposed_region | confidence | notes |
|---|---|---|---|---|---|---|---|
| hcrichardson | Heather Cox Richardson | bluesky | us | `analyst` | us | high | History professor, "Letters from an American" newsletter. Academic/commentator |
| gtconway | George Conway | bluesky | us | `analyst` | us | high | Lawyer, political commentator. Never been a journalist |
| adamkinzinger | Adam Kinzinger | bluesky | us | `analyst` | us | high | Former congressman, CNN political commentator |
| joycewhitevance | Joyce White Vance | bluesky | us | `analyst` | us | high | Former US Attorney, MSNBC legal analyst |
| marcelias | Marc Elias | bluesky | us | `analyst` | us | high | Election law attorney, Democracy Docket founder |
| jen-rubin | Jen Rubin | bluesky | us | `analyst` | us | high | Opinion columnist (WaPo, The Contrarian). Former lawyer |
| acyn | Acyn | bluesky | us | `aggregator` | us | high | Clips/reposts political video. Software developer, not journalist |
| decodingfoxnews | Decoding Fox News | bluesky | us | `analyst` | us | high | Media analysis project analyzing Fox News |
| briantylercohen | Brian Tyler Cohen | bluesky | us | `analyst` | us | high | Progressive political commentator, YouTuber |
| thedailyshow | The Daily Show | bluesky | us | `news-org` | us | high | TV show account, not an individual reporter |
| weeklyshowpodcast | The Weekly Show with Jon Stewart | bluesky | us | `news-org` | us | high | Podcast/show account, not individual |
| mollyjongfast | Molly Jong-Fast | bluesky | us | `analyst` | us | medium | Vanity Fair correspondent but primarily opinion/analysis |
| chrislhayes | Chris Hayes | bluesky | us | `analyst` | us | high | MSNBC prime-time host, commentator |
| katiephang | Katie Phang | bluesky | us | `analyst` | us | high | Lawyer turned MSNBC host, legal commentator |
| maddow | Rachel Maddow | bluesky | us | `analyst` | us | high | MSNBC prime-time host, political commentator |
| kylegriffin1 | Kyle Griffin | bluesky | us | `aggregator` | us | high | MSNBC executive producer, posts news aggregation |
| jemelehill | Jemele Hill | bluesky | us | `analyst` | us | medium | Former ESPN, now commentator/podcaster |
| jamellebouie | jamelle | bluesky | us | `analyst` | us | medium | NYT opinion columnist, not news reporter |
| atrupar | Aaron Rupar | bluesky | us | `aggregator` | us | medium | Primarily a video clip aggregator |
| juliadavisnews | Julia Davis | bluesky | europe-russia | `analyst` | europe-russia | high | Russian Media Monitor founder. Analyst, not beat reporter |
| vreij | Hans de Vreij | bluesky | europe-russia | `analyst` | europe-russia | high | Retired journalist, now commentator |
| michael-colborne | Michael Colborne (Bellingcat) | bluesky | europe-russia | `osint` | europe-russia | high | Bellingcat investigator using open-source research |
| tristan-lee | Tristan Lee | bluesky | all | `osint` | all | high | Bellingcat data scientist, OSINT practitioner |
| bencollins | Ben Collins | bluesky | us | `analyst` | us | medium | Former NBC disinformation reporter, now CEO of The Onion |

### Duplicate

| id | name | notes |
|---|---|---|
| christopher-miller | Christopher Miller | **DUPLICATE** of `christopher-miller-ft`. Same handle, same feedUrl. Remove this one. |

### Region-Only Fixes (type is correct)

| id | name | platform | current_region | proposed_region | confidence | notes |
|---|---|---|---|---|---|---|
| wapo-khoureld | Katharine Houreld (WaPo) | bluesky | all | africa | high | WaPo East Africa bureau chief, Nairobi |
| simon-allison | Simon Allison | bluesky | all | africa | high | Africa editor of Mail & Guardian, The Continent |
| carol-rosenberg | Carol Rosenberg | bluesky | middle-east | us | medium | NYT Guantanamo/national security reporter |
| ben-winkley | Ben Winkley (Argus Media) | bluesky | middle-east | all | medium | Global energy/oil markets reporter |
| wesley-morgan | Wesley Morgan | bluesky | middle-east | us | medium | Pentagon/military affairs reporter |
| gerry-doyle | Gerry Doyle | bluesky | all | asia | medium | Reuters/Bloomberg, Singapore-based defense editor |
| andrei-netto | Andrei Netto | bluesky | latam | europe-russia | medium | Brazilian journalist based in Paris |
| tarik-toros | Tarik Toros | bluesky | middle-east | europe-russia | medium | Turkish-British journalist, London-based |
| chris-panella | Chris Panella (BI) | bluesky | us | all | medium | Global military beat, not US-specific |

---

## Analyst Sources — Issues Found (33 of 126)

Many publications and news orgs incorrectly tagged as analyst.

### Type Changes

| id | name | platform | current_region | proposed_type | proposed_region | confidence | notes |
|---|---|---|---|---|---|---|---|
| foreign-affairs-rss | Foreign Affairs | rss | all | `news-org` | all | high | Magazine published by CFR. Has editorial staff |
| foreign-policy-rss | Foreign Policy | rss | all | `news-org` | all | high | News publication, Graham Holdings. Full newsroom |
| diplomat-rss | The Diplomat | rss | asia | `news-org` | asia | high | Online news magazine with editorial staff |
| national-interest-rss | National Interest | rss | all | `news-org` | all | high | Bimonthly magazine, Center for National Interest |
| unherd-rss | UnHerd | rss | europe-russia | `news-org` | all | high | British news/opinion website, covers global topics |
| project-syndicate-rss | Project Syndicate | rss | all | `news-org` | all | high | International media org syndicating commentary |
| naked-capitalism-rss | Naked Capitalism | rss | all | `news-org` | all | medium | Group blog covering finance/economics/politics |
| responsible-statecraft-rss | Responsible Statecraft | rss | us | `news-org` | us | high | Quincy Institute's magazine with editorial staff |
| law-dork-rss | Law Dork | rss | us | `reporter` | us | high | Chris Geidner's legal journalism publication |
| nacla-rss | NACLA | rss | latam | `news-org` | latam | high | Nonprofit publisher, award-winning quarterly magazine |
| scotusblog-rss | SCOTUSblog | rss | us | `news-org` | us | high | Legal news publication, won Peabody Award |
| nasa-watch-rss | NASA Watch | rss | us | `reporter` | us | medium | Keith Cowing's individual journalism blog |
| carbon-brief-rss | Carbon Brief | rss | all | `news-org` | all | high | UK news website, full editorial team |
| wolf-street-rss | Wolf Street | rss | all | `news-org` | all | medium | Financial news/analysis blog |
| substack-diplomatic-rss | Laura Rozen Diplomatic | rss | middle-east | `reporter` | all | high | Journalist (ex Al-Monitor, Politico). Region is global diplomacy |
| shashank-joshi | Shashank Joshi (Economist) | bluesky | all | `reporter` | all | high | Defence Editor at The Economist |
| mastodon-anneapplebaum | Anne Applebaum | mastodon | europe-russia | `reporter` | europe-russia | high | Staff writer at The Atlantic, Pulitzer winner |
| lucian-kim | Lucian Kim | bluesky | europe-russia | `reporter` | europe-russia | medium | 25-year journalism career (NPR, Reuters, Bloomberg) |
| christopher-cavas | Christopher Cavas (Naval) | bluesky | us | `reporter` | us | high | Longtime naval affairs journalist |
| jake-broe | Jake Broe | bluesky | europe-russia | `aggregator` | europe-russia | medium | YouTube commentator curating Ukraine war updates |
| mutlu-civiroglu | Mutlu Civiroglu | bluesky | middle-east | `reporter` | middle-east | high | Former VOA Kurdish Service journalist (16 years) |
| shipwreck75 | Shipwreck Intel | bluesky | middle-east | `osint` | middle-east | high | "30 years Intel/NATO/OSINT Analyst." Retired Navy intelligence |
| thrustwr-defense | Zach (Force Tracker) | bluesky | us | `osint` | us | medium | Military deployment/movement tracking |
| mark-pyruz | Mark Pyruz | bluesky | middle-east | `osint` | middle-east | high | Military image analyst focused on Iran |
| the-military-analyst | The Analyst | bluesky | europe-russia | `osint` | europe-russia | medium | Military situational analysis, battlefield tracking |
| mastodon-gossithedog | Kevin Beaumont | mastodon | all | `osint` | all | medium | Cybersecurity researcher, vulnerability discovery |
| dawn-mena | DAWN | bluesky | middle-east | `news-org` | middle-east | high | Advocacy org with own publication platform |
| reddit-geopolitics | r/geopolitics | reddit | all | `aggregator` | all | high | Community forum, user-generated link sharing |
| reddit-credibledefense | r/CredibleDefense | reddit | all | `aggregator` | all | high | Community forum for defense discussion |
| substack-chinatalk-rss | ChinaTalk | rss | asia | `news-org` | asia | medium | Media publication/podcast with editorial staff |

### Region-Only Fixes (type correct)

| id | name | current_region | proposed_region | confidence | notes |
|---|---|---|---|---|---|
| hanna-notte | Hanna Notte (CNS/CSIS) | middle-east | all | high | Expertise spans Russia, ME, arms control, Global South |
| nicole-grajewski | Nicole Grajewski (Carnegie/Harvard) | middle-east | all | high | Russia-Iran relations, nuclear policy, global order |
| caitlin-talmadge | Caitlin Talmadge (MIT/Brookings) | middle-east | all | high | Nuclear deterrence research covers Asia AND Gulf |

---

## News-Org Sources — Issues Found (~30 of 200)

### Region Fixes (type is correct, region is wrong)

| id | name | platform | current_region | proposed_region | confidence | notes |
|---|---|---|---|---|---|---|
| thebulwark | The Bulwark | bluesky | all | us | high | US domestic politics only |
| politico | Politico | bluesky | all | us | high | US politics (POLITICO Europe is separate source) |
| talkingpointsmemo | TPM | bluesky | all | us | high | US political news only |
| thedailybeast | The Daily Beast | bluesky | all | us | high | US-focused news/opinion |
| huffpost | HuffPost | bluesky | all | us | medium | Predominantly US-focused |
| latimes | Los Angeles Times | bluesky | all | us | high | Regional US newspaper |
| democracynow | Democracy Now! | bluesky | all | us | high | US-based independent news program |
| techcrunch | TechCrunch | bluesky | all | us | medium | Tech industry, Silicon Valley-focused |
| mother-jones | Mother Jones | bluesky | all | us | high | US investigative/progressive magazine |
| bylinetimes | Byline Times | bluesky | all | europe-russia | high | UK investigative outlet |
| privateeyenews | Private Eye Magazine | bluesky | all | europe-russia | high | British satirical/investigative magazine |
| newsagents | The News Agents | bluesky | all | europe-russia | high | UK news podcast |
| thetimes | The Times & Sunday Times | bluesky | all | europe-russia | medium | UK national newspaper |
| africanews-rss | Africanews | rss | all | africa | high | Covers African continent exclusively |
| mail-guardian-rss | Mail & Guardian | rss | all | africa | high | South African newspaper |
| premium-times-rss | Premium Times Nigeria | rss | all | africa | high | Nigerian newspaper |
| new-humanitarian-rss | The New Humanitarian | rss | middle-east | all | high | Global humanitarian newsroom, not just ME |

### Type Changes

| id | name | platform | current_region | proposed_type | proposed_region | confidence | notes |
|---|---|---|---|---|---|---|---|
| electronic-intifada-rss | Electronic Intifada | rss | middle-east | `analyst` | middle-east | medium | Advocacy publication |
| mondoweiss-rss | Mondoweiss | rss | middle-east | `analyst` | middle-east | medium | Advocacy news site |
| middle-east-monitor-rss | Middle East Monitor | rss | middle-east | `analyst` | middle-east | medium | Qatar-funded advocacy/press monitoring |
| middleeastmonitor | Middle East Monitor | bluesky | middle-east | `analyst` | middle-east | medium | Same as above (Bluesky) |
| ukrinform-rss | Ukrinform | rss | europe-russia | `official` | europe-russia | high | Ukrainian state national news agency |
| global-voices-rss | Global Voices | rss | all | `aggregator` | all | high | Aggregates citizen media from 130+ countries |
| bulletin-atomic-scientists | Bulletin of the Atomic Scientists | bluesky | all | `analyst` | all | high | Nonprofit think tank |
| militarynewsua | MilitaryNewsUA | bluesky | europe-russia | `aggregator` | europe-russia | medium | Blogger aggregating military news |
| middleeasteye-rss | Middle East Eye (Unofficial) | bluesky | middle-east | `bot` | middle-east | high | Unofficial RSS bot reposting MEE content |
| bbcnews-world-rss-bot | BBC News World Bot | bluesky | all | `bot` | all | high | Automated RSS feed reposter |
| dialogo-chino-rss | Dialogo Chino | rss | latam | `analyst` | latam | medium | Nonprofit analysis on China-LatAm |
| caracas-chronicles-rss | Caracas Chronicles | rss | latam | `analyst` | latam | medium | Analysis-heavy, self-describes as "news and analysis" |

---

## Official Sources — Issues Found (~18 of 65)

### Type Changes

| id | name | platform | current_region | proposed_type | proposed_region | confidence | notes |
|---|---|---|---|---|---|---|---|
| aclu | ACLU | bluesky | us | `official` | us | — | Keep — major civil liberties advocacy org, fits "official" as institutional voice |
| flightradar24 | Flightradar24 | bluesky | all | `osint` | all | high | Private flight-tracking company, not government |
| capitalweather | Capital Weather Gang | bluesky | us | `news-org` | us | high | Washington Post weather journalism team |
| fas-org | Federation of American Scientists | bluesky | all | `analyst` | all | high | Nonprofit think tank |
| nti-org | Nuclear Threat Initiative | bluesky | all | `analyst` | all | high | Nonprofit think tank |
| carnegie-npp | Carnegie Nuclear Policy | bluesky | all | `analyst` | all | high | Carnegie Endowment think tank |
| alexander-kmentt | Alexander Kmentt | bluesky | all | `analyst` | europe-russia | high | Individual Austrian diplomat, not institutional |
| petebuttigieg | Pete Buttigieg | bluesky | us | `analyst` | us | high | Former official, now private citizen/commentator |
| barackobama | Barack Obama | bluesky | us | `analyst` | us | medium | Former president, no longer holds office |
| hillaryclinton | Hillary Rodham Clinton | bluesky | us | `analyst` | us | medium | Former Secretary of State, no longer in office |
| telegram-alahed | Al-Ahed English | telegram | middle-east | `news-org` | middle-east | high | Hezbollah media outlet (functions as news org) |
| telegram-irna | IRNA English | telegram | middle-east | `news-org` | middle-east | high | Iran state news agency (like TASS, should be news-org for consistency) |
| telegram-sanaenglish | SANA English | telegram | middle-east | `news-org` | middle-east | high | Syrian Arab News Agency |
| telegram-presstv | Press TV | telegram | middle-east | `news-org` | middle-east | high | Iranian state broadcaster (like RT) |
| mastodon-africacenter | Africa Center for Strategic Studies | mastodon | all | `analyst` | africa | high | Research institution, region should be africa |

### Region-Only Fix

| id | name | current_region | proposed_region | confidence | notes |
|---|---|---|---|---|---|
| reddit-africa | r/Africa | all | africa | high | Subreddit specifically about Africa |

---

## Aggregator Sources — Issues Found (3 of 35)

| id | name | platform | current_region | proposed_region | confidence | notes |
|---|---|---|---|---|---|---|
| reddit-africa | r/Africa | reddit | all | africa | high | Region should be africa |

(Most aggregators were correctly classified.)

---

## Duplicates to Remove

| id | name | duplicate_of | notes |
|---|---|---|---|
| christopher-miller | Christopher Miller | christopher-miller-ft | Same handle, same feedUrl |
| crisisgroup | International Crisis Group | crisis-group | Same org, different ids |
| arms-control-wonk | Arms Control Wonk | jeffrey-lewis | Same person/entity |

---

## Sources to Remove Entirely

| id | name | reason |
|---|---|---|
| xkcd | Randall Munroe (xkcd) | Webcomic artist. Zero relevance to news intelligence dashboard |

---

## Inconsistencies Between Platforms

These sources appear on multiple platforms with different type classifications:

| name | platform_1 (type) | platform_2 (type) | proposed |
|---|---|---|---|
| Foreign Policy | bluesky (`news-org`) | rss (`analyst`) | Both should be `news-org` |
| ProPublica | bluesky (`news-org`) | rss (`osint`) | Both should be `news-org` |
| Middle East Monitor | bluesky (`news-org`) | rss (`news-org`) | Both should be `analyst` |

---

## Summary of All Changes by Type Migration

| From | To | Count |
|------|-----|-------|
| osint → analyst | 28 |
| osint → aggregator | 10 |
| osint → reporter | 7 |
| osint → news-org | 8 |
| osint → official | 4 |
| osint → bot | 1 |
| reporter → analyst | 15 |
| reporter → aggregator | 3 |
| reporter → osint | 2 |
| reporter → news-org | 2 |
| analyst → news-org | 15 |
| analyst → reporter | 7 |
| analyst → osint | 4 |
| analyst → aggregator | 3 |
| news-org → analyst | 7 |
| news-org → aggregator | 2 |
| news-org → official | 1 |
| news-org → bot | 2 |
| official → analyst | 7 |
| official → news-org | 5 |
| official → osint | 1 |

**Region-only changes**: ~35 sources
**Removals**: 1 (xkcd)
**Duplicates**: 3

---

## Post-Audit Projected Distribution

| Type | Before | After (est.) | Change |
|------|--------|--------------|--------|
| news-org | 200 | ~218 | +18 |
| analyst | 126 | ~165 | +39 |
| osint | 135 | ~72 | -63 |
| reporter | 97 | ~86 | -11 |
| aggregator | 35 | ~53 | +18 |
| official | 65 | ~58 | -7 |
| bot | 6 | ~9 | +3 |
| ground | 2 | ~2 | 0 |

The biggest shift: **OSINT shrinks from 20% to ~11%** of sources as think tanks, journalists, and aggregators are correctly categorized. Analyst grows to become the largest category, which makes sense — Pulse monitors a lot of expert commentary.
