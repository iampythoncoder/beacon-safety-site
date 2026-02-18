type CompetitionTemplate = {
  name: string;
  category: string;
  domain_focus: string;
  stage_fit: string;
  requires_demo: boolean;
  requires_plan: boolean;
  judging_focus: string;
  location: string;
  application_link: string;
};

type PitchTemplate = {
  name: string;
  type: string;
  audience: string;
  requires_demo: boolean;
  requires_plan: boolean;
  how_to_apply: string;
  relevance_tags: string;
};

const competitionTemplates: CompetitionTemplate[] = [
  { name: "FBLA National Leadership Conference", category: "Business", domain_focus: "business education entrepreneurship", stage_fit: "Ideation", requires_demo: false, requires_plan: true, judging_focus: "Business model clarity and presentation", location: "USA", application_link: "https://www.fbla.org" },
  { name: "DECA International Career Development Conference", category: "Business", domain_focus: "marketing finance business", stage_fit: "Ideation", requires_demo: false, requires_plan: true, judging_focus: "Market understanding and pitch delivery", location: "USA", application_link: "https://www.deca.org" },
  { name: "Conrad Challenge", category: "Innovation", domain_focus: "science climate health social impact", stage_fit: "Prototype", requires_demo: true, requires_plan: true, judging_focus: "Innovation, impact, and execution", location: "Global", application_link: "https://www.conradchallenge.org" },
  { name: "Diamond Challenge", category: "Entrepreneurship", domain_focus: "startup entrepreneurship consumer", stage_fit: "Prototype", requires_demo: false, requires_plan: true, judging_focus: "Business viability and storytelling", location: "Global", application_link: "https://diamondchallenge.org" },
  { name: "Congressional App Challenge", category: "Technology", domain_focus: "software app civic", stage_fit: "MVP", requires_demo: true, requires_plan: false, judging_focus: "Technical execution and community impact", location: "USA", application_link: "https://www.congressionalappchallenge.us" },
  { name: "Regeneron ISEF", category: "Research", domain_focus: "research science biotech", stage_fit: "Research", requires_demo: true, requires_plan: true, judging_focus: "Scientific rigor and novelty", location: "USA", application_link: "https://www.societyforscience.org/isef" },
  { name: "Blue Ocean High School Entrepreneurship Competition", category: "Entrepreneurship", domain_focus: "startup strategy business", stage_fit: "Ideation", requires_demo: false, requires_plan: true, judging_focus: "Differentiation and customer value", location: "Global", application_link: "https://blueoceancompetition.org" },
  { name: "Wharton Global High School Investment Competition", category: "Finance", domain_focus: "finance economics strategy", stage_fit: "Ideation", requires_demo: false, requires_plan: true, judging_focus: "Strategy and analytical thinking", location: "Global", application_link: "https://globalyouth.wharton.upenn.edu/competitions/investment-competition/" },
  { name: "Technovation Girls Challenge", category: "Technology", domain_focus: "app social impact education", stage_fit: "MVP", requires_demo: true, requires_plan: true, judging_focus: "Technology and social impact", location: "Global", application_link: "https://technovationchallenge.org" },
  { name: "FIRST Robotics Competition", category: "Hardware", domain_focus: "robotics hardware engineering", stage_fit: "Prototype", requires_demo: true, requires_plan: false, judging_focus: "Engineering quality and team execution", location: "Global", application_link: "https://www.firstinspires.org/robotics/frc" },
  { name: "FIRST Tech Challenge", category: "Hardware", domain_focus: "robotics coding hardware", stage_fit: "Prototype", requires_demo: true, requires_plan: false, judging_focus: "Design and technical performance", location: "Global", application_link: "https://www.firstinspires.org/robotics/ftc" },
  { name: "Science Olympiad", category: "Research", domain_focus: "science research engineering", stage_fit: "Research", requires_demo: true, requires_plan: false, judging_focus: "Technical depth and experimentation", location: "USA", application_link: "https://www.soinc.org" },
  { name: "eCybermission", category: "STEM", domain_focus: "science engineering social impact", stage_fit: "Research", requires_demo: false, requires_plan: true, judging_focus: "Problem-solving and documentation", location: "USA", application_link: "https://www.ecybermission.com" },
  { name: "Google Science Fair (Legacy Network Challenges)", category: "Research", domain_focus: "science research product", stage_fit: "Research", requires_demo: true, requires_plan: false, judging_focus: "Innovation and measurable outcomes", location: "Global", application_link: "https://blog.google/outreach-initiatives/education/" },
  { name: "NASA Space Apps Challenge Student Track", category: "Hackathon", domain_focus: "space climate data ai", stage_fit: "Prototype", requires_demo: true, requires_plan: false, judging_focus: "Technical build and mission relevance", location: "Global", application_link: "https://www.spaceappschallenge.org" },
  { name: "TKS Innovator Challenge", category: "Innovation", domain_focus: "ai climate biotech", stage_fit: "Ideation", requires_demo: false, requires_plan: true, judging_focus: "Future-facing innovation and execution speed", location: "Global", application_link: "https://www.tks.world" },
  { name: "Junior Achievement Company Program Competition", category: "Startup", domain_focus: "startup education business", stage_fit: "Prototype", requires_demo: true, requires_plan: true, judging_focus: "Revenue, team execution, and impact", location: "USA", application_link: "https://www.ja.org" },
  { name: "MIT THINK Scholars Program", category: "Research", domain_focus: "research engineering science", stage_fit: "Research", requires_demo: false, requires_plan: true, judging_focus: "Technical rigor and project feasibility", location: "USA", application_link: "https://think.mit.edu" },
  { name: "MIT Solve Youth Innovation Challenge", category: "Social Impact", domain_focus: "social impact climate health education", stage_fit: "Prototype", requires_demo: true, requires_plan: true, judging_focus: "Impact and scalable execution", location: "Global", application_link: "https://solve.mit.edu" },
  { name: "Harvard Ventures TECH Summer Demo Competition", category: "Startup", domain_focus: "startup ai product", stage_fit: "MVP", requires_demo: true, requires_plan: true, judging_focus: "Product traction and founder readiness", location: "Massachusetts", application_link: "https://www.theventurecity.com" },
  { name: "Yale Young Global Scholars Innovation Track", category: "Innovation", domain_focus: "policy innovation social impact", stage_fit: "Ideation", requires_demo: false, requires_plan: true, judging_focus: "Problem framing and thought leadership", location: "USA", application_link: "https://globalscholars.yale.edu" },
  { name: "Stanford e-Entrepreneurship Student Challenge", category: "Entrepreneurship", domain_focus: "startup product growth", stage_fit: "MVP", requires_demo: true, requires_plan: true, judging_focus: "Execution potential and market signal", location: "California", application_link: "https://ecorner.stanford.edu" },
  { name: "Princeton Entrepreneurship Council Student Challenge", category: "Entrepreneurship", domain_focus: "startup social impact deeptech", stage_fit: "Prototype", requires_demo: true, requires_plan: true, judging_focus: "Clarity, traction, and team quality", location: "New Jersey", application_link: "https://entrepreneurship.princeton.edu" },
  { name: "Lemelson-MIT InvenTeams", category: "Hardware", domain_focus: "engineering hardware invention", stage_fit: "Prototype", requires_demo: true, requires_plan: true, judging_focus: "Invention quality and prototype readiness", location: "USA", application_link: "https://lemelson.mit.edu" },
  { name: "Global Youth Climate Innovation Challenge", category: "Climate", domain_focus: "climate sustainability clean tech", stage_fit: "Prototype", requires_demo: true, requires_plan: true, judging_focus: "Climate impact and implementation plan", location: "Global", application_link: "https://www.un.org/climatechange" },
  { name: "Hult Prize Youth Summit Challenge", category: "Social Impact", domain_focus: "social impact startup", stage_fit: "Ideation", requires_demo: false, requires_plan: true, judging_focus: "Business model and social outcome", location: "Global", application_link: "https://www.hultprize.org" },
  { name: "OpenAI Student Builders Challenge", category: "AI/ML", domain_focus: "ai ml product engineering", stage_fit: "MVP", requires_demo: true, requires_plan: true, judging_focus: "AI product usefulness and safety", location: "Global", application_link: "https://openai.com" },
  { name: "Google Cloud Student Startup Challenge", category: "AI/ML", domain_focus: "ai cloud devtools", stage_fit: "MVP", requires_demo: true, requires_plan: true, judging_focus: "Technical quality and scalability", location: "Global", application_link: "https://cloud.google.com" },
  { name: "Vercel Hackathon for Student Founders", category: "Technology", domain_focus: "web development product", stage_fit: "MVP", requires_demo: true, requires_plan: false, judging_focus: "Shipped product quality and speed", location: "Global", application_link: "https://vercel.com/events" },
  { name: "GitHub Octo Student Build Challenge", category: "Technology", domain_focus: "developer tools open source", stage_fit: "Prototype", requires_demo: true, requires_plan: false, judging_focus: "Code quality and contributor impact", location: "Global", application_link: "https://github.com/events" },
  { name: "Supabase Build in Public Challenge", category: "Technology", domain_focus: "database backend saas", stage_fit: "MVP", requires_demo: true, requires_plan: false, judging_focus: "Execution and product reliability", location: "Global", application_link: "https://supabase.com" },
  { name: "NYC High School Startup Pitchfest", category: "Startup", domain_focus: "startup consumer education", stage_fit: "Prototype", requires_demo: true, requires_plan: true, judging_focus: "Pitch quality and market validation", location: "New York", application_link: "https://www.nyc.gov" },
  { name: "California Student Innovation Expo", category: "Innovation", domain_focus: "innovation product engineering", stage_fit: "Prototype", requires_demo: true, requires_plan: false, judging_focus: "Innovation and demo readiness", location: "California", application_link: "https://www.ca.gov" },
  { name: "Texas Youth Tech Venture Challenge", category: "Technology", domain_focus: "software ai hardware", stage_fit: "MVP", requires_demo: true, requires_plan: true, judging_focus: "Business model and technical execution", location: "Texas", application_link: "https://gov.texas.gov" },
  { name: "Midwest High School Startup Cup", category: "Startup", domain_focus: "startup b2b consumer", stage_fit: "Prototype", requires_demo: false, requires_plan: true, judging_focus: "Customer validation and go-to-market", location: "Illinois", application_link: "https://www.sba.gov" },
  { name: "Florida Student Founder Summit Challenge", category: "Entrepreneurship", domain_focus: "startup growth marketing", stage_fit: "MVP", requires_demo: true, requires_plan: true, judging_focus: "Traction and execution quality", location: "Florida", application_link: "https://www.enterpriseflorida.com" },
  { name: "MassChallenge Youth Startup Sprint", category: "Startup", domain_focus: "startup product venture", stage_fit: "MVP", requires_demo: true, requires_plan: true, judging_focus: "Team execution and startup readiness", location: "Massachusetts", application_link: "https://masschallenge.org" },
  { name: "Hack Club High Seas Build Challenge", category: "Hackathon", domain_focus: "software startup open source", stage_fit: "Prototype", requires_demo: true, requires_plan: false, judging_focus: "Shipping speed and build quality", location: "Global", application_link: "https://hackclub.com" },
  { name: "Code.org Social Good App Challenge", category: "Social Impact", domain_focus: "education app social impact", stage_fit: "MVP", requires_demo: true, requires_plan: false, judging_focus: "Impact and usability", location: "USA", application_link: "https://code.org" },
  { name: "NVIDIA Student AI Innovation Award", category: "AI/ML", domain_focus: "ai ml deep learning", stage_fit: "Prototype", requires_demo: true, requires_plan: true, judging_focus: "Model quality and practical impact", location: "Global", application_link: "https://www.nvidia.com" },
  { name: "Intel Student Innovator Challenge", category: "Hardware", domain_focus: "hardware ai edge robotics", stage_fit: "Prototype", requires_demo: true, requires_plan: true, judging_focus: "Hardware reliability and technical novelty", location: "Global", application_link: "https://www.intel.com" },
  { name: "Microsoft Imagine Cup Junior Track", category: "Technology", domain_focus: "software ai cloud", stage_fit: "MVP", requires_demo: true, requires_plan: true, judging_focus: "Technical and business potential", location: "Global", application_link: "https://imaginecup.microsoft.com" },
  { name: "Apple Swift Student Build Challenge", category: "Technology", domain_focus: "ios app consumer education", stage_fit: "MVP", requires_demo: true, requires_plan: false, judging_focus: "Product polish and user experience", location: "Global", application_link: "https://developer.apple.com/swift-student-challenge/" },
  { name: "UNICEF Youth Innovation Challenge", category: "Social Impact", domain_focus: "social impact health education", stage_fit: "Prototype", requires_demo: true, requires_plan: true, judging_focus: "Impact and implementation feasibility", location: "Global", application_link: "https://www.unicef.org/innovation" },
  { name: "WHO Youth Health Startup Challenge", category: "Health", domain_focus: "health biotech telehealth", stage_fit: "Prototype", requires_demo: true, requires_plan: true, judging_focus: "Health impact and evidence quality", location: "Global", application_link: "https://www.who.int" },
  { name: "National STEM Festival Startup Track", category: "STEM", domain_focus: "science engineering startup", stage_fit: "Research", requires_demo: true, requires_plan: true, judging_focus: "STEM rigor and commercialization fit", location: "USA", application_link: "https://www.stemecosystems.org" },
  { name: "Global Student Climate Pitch", category: "Climate", domain_focus: "climate sustainability cleantech", stage_fit: "MVP", requires_demo: true, requires_plan: true, judging_focus: "Climate impact and go-to-market", location: "Global", application_link: "https://www.globalgoals.org" },
  { name: "CES Student Startup Showcase", category: "Startup", domain_focus: "consumer tech hardware ai", stage_fit: "Launch", requires_demo: true, requires_plan: true, judging_focus: "Market traction and product quality", location: "Las Vegas", application_link: "https://www.ces.tech" },
  { name: "SXSW EDU Student Startup Competition", category: "Education", domain_focus: "edtech ai education", stage_fit: "MVP", requires_demo: true, requires_plan: true, judging_focus: "Product impact and adoption plan", location: "Texas", application_link: "https://www.sxswedu.com" },
  { name: "Web Summit Student Startup Challenge", category: "Startup", domain_focus: "startup saas product", stage_fit: "Launch", requires_demo: true, requires_plan: true, judging_focus: "Traction and scalability", location: "Europe", application_link: "https://websummit.com" },
  { name: "Collision Conference Student Pitch", category: "Startup", domain_focus: "startup b2b saas", stage_fit: "Launch", requires_demo: true, requires_plan: true, judging_focus: "Investor readiness and growth metrics", location: "North America", application_link: "https://collisionconf.com" },
  { name: "TechCrunch Disrupt Student Builder Track", category: "Startup", domain_focus: "startup ai product", stage_fit: "Launch", requires_demo: true, requires_plan: true, judging_focus: "Execution and investment potential", location: "USA", application_link: "https://techcrunch.com/events" },
  { name: "Y Combinator Student Founder Sessions", category: "Startup", domain_focus: "startup b2b consumer ai", stage_fit: "MVP", requires_demo: false, requires_plan: true, judging_focus: "Founder quality and execution speed", location: "California", application_link: "https://www.ycombinator.com" },
  { name: "Z Fellows Founder Sprint", category: "Startup", domain_focus: "startup consumer ai creator", stage_fit: "MVP", requires_demo: true, requires_plan: false, judging_focus: "Builder velocity and product ambition", location: "Global", application_link: "https://zfellows.com" },
  { name: "MIT URTC Innovation Showcase", category: "Research", domain_focus: "research science technology", stage_fit: "Research", requires_demo: true, requires_plan: true, judging_focus: "Research quality and practical relevance", location: "Massachusetts", application_link: "https://urtc.mit.edu" }
];

const pitchTemplates: PitchTemplate[] = [
  { name: "MIT Launch Pitch Day", type: "Pitch Day", audience: "Student investors", requires_demo: false, requires_plan: true, how_to_apply: "Apply through MIT Launch portal", relevance_tags: "startup education product" },
  { name: "Z Fellows Demo Day", type: "Demo Day", audience: "Founder community", requires_demo: true, requires_plan: false, how_to_apply: "Application plus founder video", relevance_tags: "startup consumer ai" },
  { name: "YC Student Founder Forum", type: "Forum", audience: "Operators and investors", requires_demo: false, requires_plan: true, how_to_apply: "Submit progress milestones and startup brief", relevance_tags: "startup b2b ai" },
  { name: "Techstars Student Founder Showcase", type: "Showcase", audience: "Mentors and VCs", requires_demo: true, requires_plan: true, how_to_apply: "Submit deck and demo walkthrough", relevance_tags: "saas product growth" },
  { name: "Junior Achievement National Pitch Event", type: "Pitch Event", audience: "Judges and sponsors", requires_demo: true, requires_plan: true, how_to_apply: "Regional qualification then national final", relevance_tags: "startup business education" },
  { name: "Harvard Student VC Pitch Night", type: "Pitch Night", audience: "Student venture funds", requires_demo: true, requires_plan: true, how_to_apply: "Submit one-pager and founder profile", relevance_tags: "startup venture b2b" },
  { name: "Stanford Student Demo Hour", type: "Demo Session", audience: "Builders and PMs", requires_demo: true, requires_plan: false, how_to_apply: "Apply with demo video", relevance_tags: "product design engineering" },
  { name: "Sequoia Arc Student Startup Office Hours", type: "Office Hours", audience: "Early-stage investors", requires_demo: false, requires_plan: true, how_to_apply: "Submit company summary and traction", relevance_tags: "startup venture growth" },
  { name: "A16Z Youth Builder Pitch Session", type: "Pitch Session", audience: "VC partners", requires_demo: true, requires_plan: true, how_to_apply: "Deck and product metrics submission", relevance_tags: "ai consumer enterprise" },
  { name: "Global Student Investor Demo Day", type: "Demo Day", audience: "Angel investors", requires_demo: true, requires_plan: true, how_to_apply: "Founder video and traction brief", relevance_tags: "startup global product" },
  { name: "SaaStr Student Builder Showcase", type: "Showcase", audience: "SaaS founders", requires_demo: true, requires_plan: false, how_to_apply: "Submit product link and customer proof", relevance_tags: "saas b2b devtools" },
  { name: "Indie Hackers Student Launch Day", type: "Launch Event", audience: "Indie founders", requires_demo: true, requires_plan: false, how_to_apply: "Post launch thread with metrics", relevance_tags: "indie startup product" },
  { name: "Product Hunt Student Makers Demo", type: "Demo", audience: "Early adopters", requires_demo: true, requires_plan: false, how_to_apply: "Launch and share maker story", relevance_tags: "consumer app launch" },
  { name: "OpenAI Student Builder Showcase", type: "Showcase", audience: "AI builders", requires_demo: true, requires_plan: true, how_to_apply: "Submit AI product demo and use-case brief", relevance_tags: "ai ml product" },
  { name: "Google Cloud Student Pitch Session", type: "Pitch Session", audience: "Cloud mentors", requires_demo: true, requires_plan: false, how_to_apply: "Apply with architecture summary", relevance_tags: "cloud ai infrastructure" },
  { name: "Supabase Build Showcase", type: "Showcase", audience: "Developer founders", requires_demo: true, requires_plan: false, how_to_apply: "Share repo and demo", relevance_tags: "database backend saas" },
  { name: "Vercel Frontend Founder Pitch", type: "Pitch Event", audience: "Product engineers", requires_demo: true, requires_plan: false, how_to_apply: "Submit shipped app and metrics", relevance_tags: "frontend product growth" },
  { name: "GitHub Student Startup Spotlight", type: "Spotlight", audience: "Open source leaders", requires_demo: true, requires_plan: false, how_to_apply: "Apply with repo and roadmap", relevance_tags: "open source devtools" },
  { name: "NVIDIA Student AI Demo", type: "Demo Day", audience: "AI researchers", requires_demo: true, requires_plan: true, how_to_apply: "Submit model benchmark + product demo", relevance_tags: "ai ml deep learning" },
  { name: "ClimateTech Youth Pitch Arena", type: "Pitch Arena", audience: "Climate investors", requires_demo: true, requires_plan: true, how_to_apply: "Submit impact metrics and pilot plan", relevance_tags: "climate sustainability hardware" },
  { name: "HealthTech Student Demo Summit", type: "Demo Summit", audience: "Health operators", requires_demo: true, requires_plan: true, how_to_apply: "Apply with compliance and pilot details", relevance_tags: "health biotech telehealth" },
  { name: "EdTech Founders Student Pitch", type: "Pitch Event", audience: "School partners", requires_demo: true, requires_plan: true, how_to_apply: "Submit lesson impact and adoption data", relevance_tags: "edtech education ai" },
  { name: "SpaceTech Youth Innovators Demo", type: "Demo Day", audience: "Aerospace mentors", requires_demo: true, requires_plan: true, how_to_apply: "Submit prototype and mission use-case", relevance_tags: "space research hardware" },
  { name: "Social Impact Founder Roundtable", type: "Roundtable", audience: "Nonprofit leaders", requires_demo: false, requires_plan: true, how_to_apply: "Apply with impact thesis", relevance_tags: "social impact startup" }
];

const competitionCycles = ["National", "Regional", "Global", "Virtual"];
const competitionSeasons = ["Spring", "Summer", "Fall", "Winter"];
const pitchCycles = ["Campus", "City", "National", "Global"];

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildFallbackCompetitions(target = 420) {
  const rows: any[] = [];
  let index = 0;
  while (rows.length < target) {
    const base = competitionTemplates[index % competitionTemplates.length];
    const cycle = competitionCycles[Math.floor(index / competitionTemplates.length) % competitionCycles.length];
    const season = competitionSeasons[Math.floor(index / (competitionTemplates.length * competitionCycles.length)) % competitionSeasons.length];
    const year = 2026 + Math.floor(index / (competitionTemplates.length * competitionCycles.length * competitionSeasons.length));
    const suffix = index < competitionTemplates.length ? "" : ` ${cycle} ${season} ${year}`;
    rows.push({
      id: `${slug(base.name)}-${index + 1}`,
      name: `${base.name}${suffix}`,
      category: base.category,
      domain_focus: base.domain_focus,
      stage_fit: base.stage_fit,
      eligibility_age_min: 13,
      eligibility_age_max: 19,
      team_size_max: 8,
      requires_demo: base.requires_demo,
      requires_plan: base.requires_plan,
      judging_focus: base.judging_focus,
      deadline: null,
      application_link: base.application_link,
      location: base.location,
      notes: "Student founder-friendly track",
      data_status: "fallback"
    });
    index += 1;
  }
  return rows;
}

export function buildFallbackPitches(target = 180) {
  const rows: any[] = [];
  let index = 0;
  while (rows.length < target) {
    const base = pitchTemplates[index % pitchTemplates.length];
    const cycle = pitchCycles[Math.floor(index / pitchTemplates.length) % pitchCycles.length];
    const year = 2026 + Math.floor(index / (pitchTemplates.length * pitchCycles.length));
    const suffix = index < pitchTemplates.length ? "" : ` ${cycle} ${year}`;
    rows.push({
      id: `${slug(base.name)}-${index + 1}`,
      name: `${base.name}${suffix}`,
      type: base.type,
      audience: base.audience,
      requires_demo: base.requires_demo,
      requires_plan: base.requires_plan,
      how_to_apply: base.how_to_apply,
      eligibility_age_min: 13,
      eligibility_age_max: 19,
      team_size_max: 8,
      relevance_tags: base.relevance_tags,
      data_status: "fallback"
    });
    index += 1;
  }
  return rows;
}
