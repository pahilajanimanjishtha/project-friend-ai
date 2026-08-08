export interface Therapist {
  name: string;
  pronouns: string;
  experience: string;
  bio: string;
  qualifications: string;
  languages: string;
  fees: string;
  link: string;
}

export interface SpecializedSession {
  name: string;
  description: string;
  facilitator: string;
  languages: string;
  fees: string;
  link: string;
}

export interface SupportHelpline {
  name: string;
  description: string;
  contact: string;
  mode: string;
  fees: string;
  link: string;
  infoText: string;
}

export const THERAPISTS: Therapist[] = [
  {
    "name": "Rajrupa Bhattacharjee",
    "pronouns": "She/They",
    "experience": "1+ years",
    "bio": "I am a trauma-informed, systemic, relational, queer-affirmative, and neurodiversity-affirming therapist with a strong social justice and intersectional lens to therapy. My approach is grounded in understanding how mental health is shaped by larger social, cultural, and political contexts, and as a queer and neurodivergent individual myself, I strive to create spaces that are affirming, reflective, responsive to each person\u2019s lived experience, and attentive to how systems of power, marginalization, and oppression shape our inner worlds. My approach is relational, drawing mainly from Relational Psychoanalysis, and integrating Existential therapy, Cognitive Analytic Therapy (CAT), and systemic approaches. I see therapy as a space to gently trace the threads that connect us to ourselves and the world and to understand how these shape who we are and how we move through our lives. I also love art and literature, and I am interested in bringing these creative and expressive processes into my work as a mental health practitioner. I tend to be process-oriented, and I view the therapy space as a microcosm of the patterns, relationships, and experiences that exist outside it. As a newer practitioner, I approach my work with humility and a commitment to learning. If you choose to work with me, I\u2019ll meet you with care and curiosity and grow alongside you.",
    "qualifications": "Bachelor of Arts in Psychology, Sociology and Literature (Triple Majors) Master of Science in Counseling Psychology",
    "languages": "Hindi, English, and Bengali",
    "fees": "25-minute chemistry session: Rs. 590 50-minute therapy session: Rs. 1180 Email us to check for their sliding scale/pro-bono session availability.",
    "link": "https://feelfuzzy.in/products/rajrupa-bhattacharjee"
  },
  {
    "name": "Aadishree Ravi",
    "pronouns": "She/Her",
    "experience": "3+ months",
    "bio": "I am a psychologist with a Masters in Clinical Psychology during which I gained hands-on experience in working with individuals with diverse backgrounds and various settings from hospitals, NGOs to childcare. I am deeply curious about the human mind and I bring this in my therapy practice, as it helps me understand the client's story and experience extensively. Through this, I ensure the client feels heard, seen and validated. I work best with young adults and towards issues of relationship, adjustment and trauma/grief. My therapeutic approach is rooted in the Rogerian school of thought (Client-Centered Therapy), and Emotionally Focused Therapy from a Trauma-informed and community focused lens. I draw from other approaches such as DBT, ACT and REBT depending on what fits the client's needs. In my practice, my focus is to build safety and agency for clients.",
    "qualifications": "BSc Psychology (Hons) and MSc Clinical Psychology",
    "languages": "English and Tamil",
    "fees": "25-minute chemistry session: Rs. 532 50-minute therapy session: Rs. 1062 Email us to check for her sliding scale session availability.",
    "link": "https://feelfuzzy.in/products/aadishree-ravi"
  },
  {
    "name": "Aishwarya Singla",
    "pronouns": "She/Her",
    "experience": "3.5+ years",
    "bio": "I am Aishwarya Singla (she/her), a counselling psychologist offering trauma-informed, relational therapy using narrative practices and some other approaches to Indian adults. My work is grounded in deep respect for your lived experience and in the belief that healing becomes possible when we feel safe, seen, and supported. For me, therapy is not a space to \u201cfix\u201d your life or get solutions for your problems. I believe every individual knows themselves the best, knows what works for them, and what does not. I, as a therapist, will hold a collaborative space where you can find a support system that will help you build a resource/ tool kit for difficult times, for life. Where you will be held while detangling the knots of life, your mind, and make more sense of things, and of self. It is a journey; it does not have a specified end date. It is a very personal process where at both ends are humans, where you are coming to me with your lived experiences and wisdom. Therapy with me is rooted in relationships and guided by curiosity, care, and accountability. I don\u2019t see distress as something that exists in isolation. It is often shaped by internal experiences, relational and cultural histories, and systems that operate on us. Therapy is not about fixing who you are; it is about creating space for reflection, clarity, and choice in how you want to move forward. I use an eclectic approach, borrowing techniques from CBT, SFBT, Mindfulness practices, majorly incorporating narrative practices, with a trauma-informed lens.",
    "qualifications": "M.Sc. in Psychological Counselling",
    "languages": "English, Hindi, Punjabi",
    "fees": "25-minute chemistry session: Rs. 885 50-minute therapy session: Rs. 1770 Email us to check for her sliding scale session availability.",
    "link": "https://feelfuzzy.in/products/aishwarya-singla"
  },
  {
    "name": "Sanya Gupta",
    "pronouns": "She/Her",
    "experience": "1+ years",
    "bio": "I work with clients to understand their emotional and relational patterns, with an awareness of how past and present relationships shape the way we think, feel, and respond. Together, we notice recurring patterns and gently work towards more supportive ways of relating to others as well as oneself. Counselling with me is primarily person-centered and relational in nature, with a trauma-informed lens. Our sessions are guided by your lived experience and your pace, within a collaborative therapeutic relationship. The therapeutic relationship remains central to my work, supporting both healing and self-discovery in a space that is non-judgmental and empathetic. I work with concerns such as anxiety, stress and burnout, self-exploration and identity, relationship and interpersonal difficulties, family dynamics, and experiences of grief and trauma. I primarily work with a person-centered and relational approach, integrating concepts from trauma-informed care.",
    "qualifications": "MA Clinical Psychology BA Applied Psychology",
    "languages": "English and Hindi",
    "fees": "25-minute chemistry session: Rs. 590 50-minute therapy session: Rs. 1180 Email us to check for her sliding scale/pro-bono session availability.",
    "link": "https://feelfuzzy.in/products/sanya-gupta"
  },
  {
    "name": "Ankita Agarwal",
    "pronouns": "She/They",
    "experience": "5+ years",
    "bio": "As a mental health professional, I aim to hold a space that is inclusive, affirmative, non-judgemental and actively works towards dismantling oppressive systems. This to me, means honoring each individual\u2019s experiences and identities while working towards change. I identify as neurodivergent and queer myself, and often work with people who may identify similarly. I have about 5 years of experience in my practice and have spent a majority of this building more standards of care over and above my education so as to better provide support and care keeping in mind the intersections and ecosystems in which we all exist. Approach to therapy: Narrative Therapy, Client Centered Therapy, Queer and Trans Affirmative Therapy, Poly Affirmative Therapy.",
    "qualifications": "Masters in Clinical Psychology Post Graduate Diploma in Counselling Psychology Certificate Course in Narrative Therapy Certificate Course in Queer Affirmative Counselling Practice",
    "languages": "Hindi and English",
    "fees": "25-minute chemistry session: Rs. 1180 50-minute therapy session: Rs. 2360 75-minute couple\u2019s therapy session: Rs. 3540 Email us to check for their sliding scale/pro-bono session availability.",
    "link": "https://feelfuzzy.in/products/ankita-agarwal"
  },
  {
    "name": "Nitya Vashistha",
    "pronouns": "She/Her",
    "experience": "2+ years",
    "bio": "I aim to provide a supportive and non-judgemental environment where my clients can feel comfortable in sharing their thoughts and experiences. I use a client-centered approach in therapy, guided by feminist and caste-aware principles. My goal is to provide a safe, reliable and supportive environment to my clients. I am passionate about providing accessible care to marginalized communities. I use an eclectic approach, which means using a blend of different therapeutic techniques tailored to suit the client's needs. I use a person-centered approach along with Cognitive Behavioural Therapy. I am also trained in trauma-informed care. Few of the areas that I specialise in are anxiety, depression, self-esteem, stress management , relationship issues , body image issues, gender identity, loneliness and motivation.",
    "qualifications": "B.A.(Hons) in Psychology M.A. in Clinical Psychology -",
    "languages": "Hindi and English",
    "fees": "25-minute chemistry session: Rs. 982 50-minute therapy session: Rs. 1963 Email us to check for their sliding scale/pro-bono session availability.",
    "link": "https://feelfuzzy.in/products/nitya-vashistha"
  },
  {
    "name": "Ritika Raina",
    "pronouns": "She/Her",
    "experience": "1+ months",
    "bio": "A warm and reflective space to slow down, sit with the messy and meaningful parts of being human, and gently make sense of yourself at your own pace. I value creating warm, safe, and non-judgmental spaces where people can show up as they are and feel understood in their context, rather than being placed into rigid labels or categories of normal and abnormal. I approach my work from an inclusive and intersectional lens and remain mindful of my own positionality and the power dynamics that exist within therapeutic spaces. I work collaboratively with clients, move at a pace that feels comfortable for them, and focus on helping them slowly make sense of their inner world. I follow an integrative approach to therapy with a foundation in psychodynamic understanding, where early experiences, relationships, and internal conflicts are seen as shaping how we relate to ourselves and others in the present. The therapeutic space is reflective and exploratory, allowing thoughts, emotions, and patterns to unfold over time. The therapeutic relationship itself becomes an important part of understanding these patterns and making sense of inner experiences more clearly. Difficult feelings may come up in the process, but they are explored with care and at a pace that feels safe and manageable. Rather than offering quick fixes or advice, the focus is on building insight and emotional awareness that can support meaningful and lasting change.",
    "qualifications": "BA (Hons) Sociology MA Psychology",
    "languages": "Hindi and English",
    "fees": "25-minute chemistry session: Rs. 708 50-minute therapy session: Rs. 1416 Email us to check for their sliding scale session availability.",
    "link": "https://feelfuzzy.in/products/ritika-raina"
  },
  {
    "name": "Tanisha Goveas",
    "pronouns": "She/They",
    "experience": "6+ years",
    "bio": "I am a trauma-informed, neurodivergent-friendly, queer-affirmative therapist and therapeutic arts facilitator, with a social-justice and intersectional lens to therapy. I am also a lifelong student, constantly finding new things to learn about mental health and more. I take special interest in working with LGBTQIA+ concerns, perinatal mental health, body image issues, sleep issues, unhealthy eating patterns, depression, anxiety, stress, eco-anxiety, financial anxiety, relationship issues, workplace stress, and difficulty in navigating life challenges. I use an eclectic approach focusing on lived experience, narratives, mindfulness, and art and movement.",
    "qualifications": "MA Psychology BA Psychology",
    "languages": "English and Hindi",
    "fees": "25-minute chemistry session: Rs. 1180 50-minute therapy session: Rs. 2360",
    "link": "https://feelfuzzy.in/products/tanisha-goveas"
  },
  {
    "name": "Sarah Fernandes",
    "pronouns": "she/her",
    "experience": "2+ years",
    "bio": "I\u2019m a dynamic counseling psychologist with a Master\u2019s in Counseling Psychology. I\u2019m deeply passionate about mental health, education, and LGBTQIA+ advocacy. I\u2019ve founded Sarah Talks Psychology to make therapy and psychological concepts more accessible. With a strong academic background that includes a Bachelor\u2019s in Psychology from St. Xavier\u2019s, Mumbai, I\u2019ve gained practical experience through diverse internships in counseling, mental health projects, and wellness initiatives. I\u2019ve also authored Amazon bestsellers and contributed to anthologies. I excel in interpersonal skills, conflict resolution, and critical thinking, always striving to foster mental well-being and create a meaningful impact. I use concepts from Narrative therapy, Trauma-informed therapy, QACP, and REBT in my therapy sessions.",
    "qualifications": "BA in Psychology, MSc in Counseling Psychology,",
    "languages": "English, Hindi, Konkani",
    "fees": "25-minute chemistry session: Rs. 708 50-minute therapy session: Rs. 1416 Email us to check for her sliding scale/pro-bono session availability.",
    "link": "https://feelfuzzy.in/products/sarah-fernandes"
  },
  {
    "name": "Reuben Mathew",
    "pronouns": "He/him",
    "experience": "5+ years",
    "bio": "I\u2019ve been in psychology for over 5 years and hold a Master\u2019s in Clinical Psychology. I\u2019ve had the privilege of working with a wide range of people \u2014 from children with special needs to adolescents to adults navigating life\u2019s complexities. Throughout my journey, one thing stood out: just listening. Whether I was working with children, talking to parents, guiding students, or simply having a chat with someone I met on the street, active listening was what built the connection. I realized that when people feel heard, they feel acknowledged, and they feel important. I work best towards issues of relationship, family, and trauma, and as a result, this causes all sorts of emotional uprisings. My primary therapeutic approaches are Client-Centered Therapy (CCT) and Cognitive Behavioral Therapy (CBT). I focus on creating a safe, empathetic space where clients feel heard and understood (CCT), while also working collaboratively to identify unhelpful thought patterns and build practical strategies for change (CBT).",
    "qualifications": "M.Sc. In Clinical Psychology",
    "languages": "English, Hindi, Gujarati",
    "fees": "25-minute chemistry session: Rs. 1180 50-minute therapy session: Rs. 2360",
    "link": "https://feelfuzzy.in/products/reuben-mathew\n1"
  },
  {
    "name": "Geetha Rajini B",
    "pronouns": "she/her",
    "experience": "2+ years",
    "bio": "Hello, I am Geetha, and I am a Counselling Psychologist with over 2 years of experience. My goal as a therapist is to support you in learning how to face the ups and downs of life and to help you navigate challenging times with self-awareness and care. My main focus is to create a space where you can make sense of yourself and help you figure out how to navigate life. I believe in building an egalitarian relationship with my clients and making them feel heard and seen. I believe that every person is doing the best they can, given the situation they are in, and it is important to be able to create space to hold their stories while helping them learn and unlearn. I am here to challenge your unhelpful patterns and support you to grow into the life you want to live. Living with type 1 diabetes and chronic pain, I also bring my understanding of self-compassion and resilience into my work. I use an integrative approach drawing from narrative therapy, feminist therapy, and IFS, along with a relational lens.",
    "qualifications": "M.Sc. in Counselling Psychology",
    "languages": "English and Kannada",
    "fees": "25-minute chemistry session: Rs. 708 50-minute therapy session: Rs. 1416 Email us to check for her sliding scale session availability.",
    "link": "https://feelfuzzy.in/products/geetha-rajini-g"
  },
  {
    "name": "Devyani B",
    "pronouns": "she/her",
    "experience": "2+ years",
    "bio": "Thoughtful, compassionate therapy for individuals & couples. Hello! I\u2019m Devyani, a practicing psychologist with an affirmative, non-pathologising, and collaborative approach to psychotherapy. I hold a B.A. (Hons) in Psychology from Lady Shri Ram College for Women, University of Delhi, and an M.A. in Clinical Psychology from the Department of Applied Psychology, University of Delhi. I have completed certifications in Dialectical Behaviour Therapy, Interpersonal Therapy, and Couples Counselling as well. I work with adults experiencing anxiety, low mood, emotional overwhelm, self-doubt, life transitions, relationship concerns, grief, loneliness, and workplace or academic stress. In addition to individual therapy, I also offer couples counselling, supporting partners in navigating communication difficulties, recurring conflict, and periods of transition within their Relationship. My therapeutic approach is eclectic, with CBT as the foundation, and elements drawn from IPT, DBT, ACT, and attachment-informed perspectives based on what best supports each client\u2019s needs. My approach to therapy is also queer-affirmative and trauma-affirmative. I constantly endeavour to create a therapeutic space that is safe, reciprocal, and non-judgmental, which welcomes individuals from all backgrounds, identities, and lived experiences .",
    "qualifications": "B.A. (Hons.) Psychology, M.A. Clinical Psychology",
    "languages": "English, Hindi",
    "fees": "25-minute chemistry session: Rs. 944 50-minute therapy session: Rs. 1888 75-minute couple\u2019s therapy session: Rs. 2832 Email us to check for her sliding scale session availability.",
    "link": "https://feelfuzzy.in/products/devyani-b"
  },
  {
    "name": "Naveli Saxena",
    "pronouns": "she/her",
    "experience": "3+ years",
    "bio": "My work is deeply rooted in a trauma-informed, neuro-affirmative, and relational approach. I believe emotions aren't meant to be controlled but understood and integrated. Beyond traditional therapy rooms, I am passionate about creating alternative, community-driven spaces where healing happens through connection, storytelling, and shared experiences. I specialize in working with individuals with ADHD, navigating trauma, grief, anxiety, and attachment difficulties, always through a socio-cultural lens. I draw from narrative therapy, emotion-focused therapy, and psychodynamic thought, not just for symptom relief, but to help people unpack their stories and make space for emotions in all their complexity. My work is deeply rooted in a trauma-informed, neuro-affirmative, and relational approach. I draw from narrative therapy, emotion-focused therapy, and psychodynamic thought",
    "qualifications": "M.Sc. Neuropsychology",
    "languages": "English, Hindi",
    "fees": "25-minute chemistry session: Rs. 1062 50-minute therapy session: Rs. 2124 Email us to check for her sliding scale/pro-bono session availability.",
    "link": "https://feelfuzzy.in/products/naveli-saxena"
  },
  {
    "name": "Dr. Pragya Sharma",
    "pronouns": "she/her",
    "experience": "15+ years",
    "bio": "I am a Senior Clinical Psychologist with over 15 years of specialized experience, working with high-achieving adults and couples who are no longer satisfied with merely \u201ccoping\u201d or \u201cfunctioning.\u201d My work is for those who appear successful on the outside yet experience inner exhaustion, relational strain, emotional disconnection, or a persistent sense of being stuck despite insight and achievement. I am registered with the Rehabilitation Council of India (RCI). My clinical work spans premier hospitals and long-standing private practice, grounded in ethical rigor, evidence-based care, and emotional precision. My therapeutic work is bespoke and highly individualized, designed for clients who value psychological sophistication, discretion, and meaningful change. I work through an integrative clinical approach tailored to the complexity of your inner world, combining advanced CBT, neuroscience-informed mindfulness, and depth-oriented insight. My work is depth-oriented rather than solution-driven, focused on meaningful recalibration rather than surface-level problem management. Therapy here is a deliberate process of psychological refinement and growth, not a set of quick techniques or temporary fixes. My practice is LGBTQ-informed, strictly confidential, and intentionally selective. I work with clients who value discretion, psychological sophistication, and a serious investment in their inner architecture. This is therapy for those who want their inner life to match the strength, coherence, and intentionality of their outer world.",
    "qualifications": "PhD, M.Phil. Clinical Psychology",
    "languages": "English, Hindi",
    "fees": "25-minute chemistry session: Rs. 4543 50-minute therapy session: Rs. 9086",
    "link": "https://feelfuzzy.in/products/dr-pragya-sharma"
  },
  {
    "name": "Angelin Jose",
    "pronouns": "She/her",
    "experience": "2+ years",
    "bio": "I use an integrative approach that is tailor-made according to each client\u2019s needs. My therapeutic lens is grounded in Acceptance and Commitment Therapy and Feminist Therapy, along with elements from Cognitive Behavioural Therapy and Narrative Therapy. Through over 700 hours of therapeutic practice, I have worked with individuals navigating a range of emotional and psychological concerns, which has deepened my commitment to offering care that is collaborative, compassionate, and client-centred. Mental health has always felt like a calling to me. From a young age, I found myself drawn to people\u2019s stories\u2014both fictional and those around me in the real world. Their resilience and desire to move through life\u2019s hardships inspired me, while also making me deeply curious about the human mind. While pursuing my triple major in Psychology, English, and Journalism, I discovered that this curiosity could become a meaningful path in the field of mental health. Pursuing a Master\u2019s in Counselling Psychology further strengthened this passion, allowing me to build both practical therapeutic skills and a deeper theoretical understanding. I chose this profession with the hope of supporting individuals in reclaiming power over their lives, developing emotional regulation, and moving toward a life that feels fulfilling and meaningful on their own terms.",
    "qualifications": "MSc Counselling Psychology",
    "languages": "English, Malayalam, Hindi",
    "fees": "25-minute chemistry session: Rs. 694 50-minute therapy session: Rs. 1389 Email us to check for her sliding scale/pro-bono session availability.",
    "link": "https://feelfuzzy.in/products/angelin-jose"
  },
  {
    "name": "Sakshi Singhania",
    "pronouns": "She/Her",
    "experience": "5+ years",
    "bio": "I\u2019m a counselling psychologist who has worked globally to empower people by offering a safe and supportive space where they can explore themselves and move toward their full potential. Through my work, I have supported 2000+ individuals across the world, including people from the USA, UK, Canada, the Middle East, France, Vietnam, and other regions, which has given me the opportunity to work with diverse experiences, cultures, and life contexts. Some of the areas I work with include stress, anxiety, depression, relationships, self-esteem concerns, trauma, productivity, and work-life balance. Love and fun are words that deeply resonate with me. I believe that learning to love and accept oneself can often become the starting point for many of our answers and healing journeys. I\u2019m naturally curious and enthusiastic, and I also find joy and grounding in nature. In my therapeutic work, I use an integrated approach with a focus on Integrated Somatic Trauma Therapy, Cognitive Behaviour Therapy (CBT), and Circadian Rhythm Optimization, helping clients understand the connection between mind and body while building practical tools for everyday life.",
    "qualifications": "Master of Science (M.Sc.) Counselling Psychology, Bangalore, India Integrative Somatic Trauma Therapy, USA Neuro Linguistic Programming (NLP) Practitioner Level, Bangalore, India Post Graduate Diploma in Psycho-Social Well-Being Using Multi-Arts and Play, Bangalore, India \u2022 Training in Cognitive Behaviour Therapy (CBT), Canada \u2022Basic Pranic Healing Course, Odisha, India",
    "languages": "Hindi, English, Odia",
    "fees": "25-minute chemistry session: Rs. 2065 50-minute therapy session: Rs. 4130 90-minute couple\u2019s therapy session: Rs. 2832 Email us to check for her sliding scale availability.",
    "link": "https://feelfuzzy.in/products/sakshi-singhania"
  },
  {
    "name": "Tejasvee Gujjula",
    "pronouns": "she/her",
    "experience": "3+ years",
    "bio": "Affirmative therapy for queer, gender-diverse, and neurodivergent individuals navigating emotionally complex lives. Hi, I\u2019m Tejasvee, a counseling psychologist dedicated to creating safe, affirming spaces for individuals to explore their mental health. My approach is collaborative and tailored, drawing from multiple therapeutic schools. As a neurodivergent therapist, I recognize that there\u2019s no one-size-fits-all approach, which is why I integrate a queer-affirmative, trauma-informed, sex-positive, and kink-aware lens into my work. I hold a master\u2019s degree in Clinical Psychology and have undergone hands-on training to refine my therapeutic skills. My experience includes working with infertility patients and individuals from marginalized and LGBTQ+ communities, deepening my understanding of the unique challenges they face. In my practice, I focus on supporting neurodivergent individuals, those exploring their identities, and anyone seeking a nonjudgmental space for growth. My own experiences with mental health led me to this work\u2014I know how transformative it is to feel truly seen and supported. Therapy, to me, is a partnership where we uncover strengths, work through challenges, and build a life that feels more authentic and fulfilling. I believe in providing a tailored approach that meets each client\u2019s unique needs. That\u2019s why I incorporate third-wave therapies such as Acceptance and Commitment Therapy (ACT), Dialectical Behavior Therapy (DBT), and mindfulness-based practices, allowing for a flexible and client-centered approach to healing and growth.",
    "qualifications": "M.Sc. Clinical Psychology",
    "languages": "English, Hindi, Telugu",
    "fees": "25-minute chemistry session: Rs. 1003 50-minute therapy session: Rs. 2006 Email us to check for her sliding scale/pro-bono session availability.",
    "link": "https://feelfuzzy.in/products/tejasvee-gujjula"
  },
  {
    "name": "Annesha Roy",
    "pronouns": "She/her",
    "experience": "3+ years",
    "bio": "I am a trauma-informed and LGBTQIA+ inclusive therapist. I work with clients who deal with family systems, relationships, stress across various areas, anxiety, and depression. I believe our childhood shapes how we see the world and affects our adult relationships and life. The Indian family system and its influence on the individual is something that I have expertise in. I work diligently with clients to overcome challenges that they face in their personal and professional lives with tailored treatment plans. Whether it's anxiety, depression, trauma, relationship issues, or personal growth, I aim to create a safe and welcoming space for your well-being journey. Age Range: 18 to 45 years I'm a Therapist for: Couples Therapy, Depression, Interpersonal Conflicts, Childhood Trauma, Anxiety, Self- Growth, and Processing Grief. Therapy Approach: I leverage evidence-based techniques, such as CBT, Emotion Focused Therapy, and Solution Focused Brief Therapy, to tailor our therapy sessions to your specific needs. Whether you're grappling with anxiety, depression, trauma, relationship issues, or seeking personal growth or healing from grief, I'm here to provide a warm and welcoming space for your journey towards well-being",
    "qualifications": "Msc Clinical Psychology EMDR certified Levels 1&2 Currently pursuing Narrative Practices with The Dulwich Centre",
    "languages": "Bengali, Hindi, and English",
    "fees": "25-minute chemistry session: Rs. 708 50-minute therapy session: Rs. 1416 Email us to check for her sliding scale/pro-bono session availability.",
    "link": "https://feelfuzzy.in/products/annesha-roy"
  },
  {
    "name": "Kashish Kataria",
    "pronouns": "She/Her",
    "experience": "2+ Years",
    "bio": "With experience of 1200+ sessions, I help Young Adults (18-30 years) make sense of anxiety, emotional chaos, and self-sabotaging patterns. We'll explore what\u2019s holding you back and bring your authentic needs and emotions to the surface, all with curiosity, compassion, and honesty. My approach is about the here and now, using spontaneity, emotions, and real human connection to explore what\u2019s really going on for you. Some sessions are reflective, helping you notice patterns and make sense of your feelings, while others are more experiential, letting you try things out and see what shifts. This isn\u2019t a space for fixing or labelling you. It\u2019s a space for awareness, responsibility, and the freedom that comes with understanding yourself deeply. My approach to therapy: Gestalt Therapy, Psychodynamic approach, Transactional Analysis, and Attachment theories",
    "qualifications": "M.Sc. Counselling Psychology",
    "languages": "Hindi and English",
    "fees": "25-minute chemistry session: Rs. 885 50-minute therapy session: Rs. 1652 Email us to check for her sliding scale session availability.",
    "link": "https://feelfuzzy.in/products/kashish-kataria"
  },
  {
    "name": "Kavya Shah",
    "pronouns": "She/they",
    "experience": "3+ years",
    "bio": "Hello, I\u2019m Kavya, a counselling psychologist with a Master\u2019s in Clinical Psychology. My work focuses on supporting mental health and emotional well-being through a collaborative and compassionate therapeutic space where we can explore both your struggles and your goals. My approach to therapy is rooted in narrative practices, motivational interviewing, and Internal Family Systems (IFS), while also being trauma-informed and guided by a queer-affirmative and disability-inclusive lens. I focus on building safety and working at a pace that feels right for you, sometimes incorporating somatic tools to help reconnect with the body and support gentle healing. Over the past 3+ years, I have supported clients navigating grief, burnout, anxiety, trauma, intimacy, sexuality, and life transitions, helping them move toward greater clarity and hope. With experience at a sexual wellness organization, I also work with concerns around pleasure, desire, body image, and relationships. My practice is kink-affirming, and I aim to create a space where even the questions that feel difficult or awkward can be explored openly and without judgment.",
    "qualifications": "M.A in Clinical psychology",
    "languages": "English, Hindi, and Gujarati",
    "fees": "25-minute chemistry session: Rs. 708 50-minute therapy session: Rs. 1416 Email us to check for her sliding scale/pro-bono session availability.",
    "link": "https://feelfuzzy.in/products/kavya-shah"
  },
  {
    "name": "Abhilasha Dhariwal",
    "pronouns": "She/her",
    "experience": "4+ years",
    "bio": "Hello! I\u2019m a Counselling Psychologist with 4+ years of experience with adults and young adults in offline and online settings. I work with people experiencing emotional and behavioural disturbances, grief and loss, life transitions, interpersonal issues, suicidal ideation and NSSI, infertility, workplace and academic stress, and self-development. As an LGBTQ+ affirmative therapist, I am focused on asexuality and aromanticism. I utilize an evidence-based approach in therapy, concentrating on a client-centered approach, CBT, and DBT. I believe therapy to be a reciprocal and collaborative relationship where the client and therapist have the opportunity to learn from each other and work together to help the client achieve growth.",
    "qualifications": "MSc Clinical Psychology BA (Hons.) Applied Psychology",
    "languages": "English and Hindi",
    "fees": "25-minute chemistry session: Rs. 1386 50-minute therapy session: Rs. 2773 Email us to check for her sliding scale/pro-bono session availability.",
    "link": "https://feelfuzzy.in/products/abhilasha-dhariwal"
  },
  {
    "name": "Rujuta Joshi",
    "pronouns": "She/her",
    "experience": "4+ years",
    "bio": "Hello! I'm Rujuta Joshi, a dedicated psychotherapist. I hold an MA in Clinical Psychology from R.D. National College and a Post Graduate Diploma in Counselling Psychology from St. Xavier\u2019s Institute of Counselling Psychology. Over the last few years in practice, I have conducted 1000+ therapy sessions and worked with more than 120 clients, supporting individuals through concerns such as anxiety, body image challenges, complex trauma, stress, and emotional regulation. These experiences have deepened my commitment to creating a space where clients feel genuinely heard, understood, and supported. My therapeutic approach is primarily person-centered, while also integrating elements from art-based, somatic, and cognitive techniques. I believe in creating a supportive and non-judgmental environment where clients can explore their thoughts and feelings freely. My work is collaborative, and I view the therapeutic relationship as a vital foundation for growth and healing. A key strength I bring to therapy is my ability to empathize deeply and meet clients where they are, offering a space where they can simply be themselves while moving toward greater self-understanding and resilience. Outside of therapy, I enjoy cooking, singing, playing, and engaging in creative activities like art.",
    "qualifications": "MA in clinical psychology. PG Diploma in counselling psychology Practitioner training in Integral Somatic Psychology (ISP)",
    "languages": "Marathi, Hindi, English",
    "fees": "25-minute chemistry session: Rs. 1062 50-minute therapy session: Rs. 2124 Email us to check for her sliding scale/pro-bono session availability.",
    "link": "https://feelfuzzy.in/products/rujuta-joshi"
  },
  {
    "name": "Gitanjali Somanathan",
    "pronouns": "She/her",
    "experience": "3+ years",
    "bio": "I am a certified mental health counsellor working with a feminist and integrative approach to counselling. I offer a non-judgmental and confidential space for clients to process any difficult situations or emotions they are dealing with and to guide them to identify goals, improve communication and coping skills, strengthen self-esteem, and work towards mental wellness. As a feminist, drawing from lived, learnt, and professional experience, my practice acknowledges and makes space for the real-life experiences of our gender, queer, and caste identities.",
    "qualifications": "Master's in Social Sciences. M.A in Counselling Psychology Trained and Certified Counsellor.",
    "languages": "English, Tamil, and Telugu",
    "fees": "25-minute chemistry session: Rs. 885 50-minute therapy session: Rs. 1770 Email us to check for her sliding scale/pro-bono session availability.",
    "link": "https://feelfuzzy.in/products/gitanjali-somanathan"
  },
  {
    "name": "Prakriti Nanda",
    "pronouns": "She/her",
    "experience": "7+ years",
    "bio": "I\u2019m a counselling psychologist and psychotherapist based with a strong passion for mental health, music, sports, and education. My multidisciplinary background allows me to draw insights from different fields, enriching the way I approach therapy. I believe that mental health is deeply intertwined with our identities and intersectional experiences, and that understanding these layers can become a powerful resource for healing and growth. My work is grounded in relational psychodynamic therapy, which helps clients strengthen their self-attachment and develop healthier, more fulfilling relationships. I also specialize in Mentalization-Based Therapy (MBT) and integrate elements from Cognitive Behavioural Therapy (CBT), Solution-Focused Brief Therapy (SFBT), and Narrative Therapy. My approach is queer-affirmative, trauma-informed, sex-positive, and feminist, with a focus on creating a space where clients feel safe exploring their inner world and lived experiences. I often work with individuals who may have tried shorter-term therapy models and are now seeking a deeper understanding of themselves, particularly when navigating chronic emotional pain, attachment wounds, or relational patterns. Over the course of my practice, I have worked with more than 500 clients, supporting them in developing new emotional possibilities and more meaningful connections with themselves and others. As a queer therapist, I also have a deep understanding of the unique challenges and joys within the LGBTQIA+ community. I frequently support queer individuals and couples in navigating identity, relationships, and mental well-being within an affirming and supportive therapeutic space.",
    "qualifications": "Master's degree in Counselling Psychology from G.D. Goenka University. Certified as an Advanced Mentalization-Based Therapy Practitioner from Anna Freud Centre for Children and Families",
    "languages": "English and Hindi",
    "fees": "25-minute chemistry session: Rs. 1239 50-minute therapy session: Rs. 2478",
    "link": "https://feelfuzzy.in/products/prakriti-nanda"
  },
  {
    "name": "Turfa Ahmed",
    "pronouns": "She/her",
    "experience": "4+ years",
    "bio": "Hi, I am Turfa Ahmed, an RCI-registered Clinical Psychologist in India, and I have worked with over 200 individuals who reached out for therapy when life started feeling exhausting or confusing, as well as with those who simply wanted to understand themselves better and focus on personal growth, even without a big crisis. Many of my clients come to therapy for anxiety, overthinking, self-doubt, people-pleasing, burnout, relationship stress, family difficulties, and identity concerns. This often shows up as racing thoughts that won\u2019t switch off - replaying conversations, worrying about what they said, imagining worst-case outcomes, and feeling mentally exhausted because their mind keeps looping even when they want to rest. Others find themselves constantly doubting, putting everyone else first at their own cost, repeating painful relationship patterns, carrying family experiences that still hurt, or feeling unsure about who they really are and what they want from life, feel like they are \u201cnot enough\u201d even when they are doing their best, and the feeling of \u201cI\u2019m not okay, but I don\u2019t know why.\u201d In therapy, I help you understand what\u2019s really going on and find kinder ways to cope and care for yourself. It\u2019s not just about talking; it\u2019s about building clarity, emotional safety, and finding workable ways to make your everyday life easier. My way of working is collaborative, inclusive, and queer-affirmative. You don\u2019t have to hide parts of who you are here, and you don\u2019t need to know what to say. We go at your pace, and we figure things out together.",
    "qualifications": "M.Phil. (Clinical Psychology), RCI recognized M.A. (Psychology) B.A. Honours (Psychology).",
    "languages": "Hindi, English, Bengali",
    "fees": "25-minute chemistry session: Rs. 1475 50-minute therapy session: Rs. 2950 Email us to check for her sliding scale/pro-bono session availability.",
    "link": "https://feelfuzzy.in/products/turfa-ahmed"
  },
  {
    "name": "Richa Vashista",
    "pronouns": "She/they",
    "experience": "12+ years",
    "bio": "Richa Vashista is an integrative psychologist from India with over a decade of experience in the mental health ecosystem. She offers shores of support to South Asian communities across the globe. In her practice, she offers therapy, provides professional supervision, and holds monthly online support spaces for gender diverse, sexual diverse, and neurodiverse folks. In addition to her clinical work, she partners with institutions & companies to support their mental health & DEIB goals. In 2024, Richa was honored with the 'Most Prominent Diversity & Inclusion Leader' award by World HRD Congress. A typical session can be reflective, non-directive/semi-directive, making space for a collaborative environment. Drawing from internal family systems (IFS) and humanistic principles, Richa delves into the understanding of sub-personalities (parts) that exist within individuals' lives. Her goal in therapy is to facilitate integration among all parts, enabling them to co-exist and support clients on their journey towards self-discovery. Richa focuses on people and their experiences, rather than the labels they receive, using a non-pathological framework.",
    "qualifications": "Master's in Psychology (clinical training), SNDT University",
    "languages": "English and Hindi",
    "fees": "25-minute chemistry session: Rs. 2360 50-minute therapy session: Rs. 4720",
    "link": "https://feelfuzzy.in/products/richa-vashista"
  },
  {
    "name": "Dr. Soumiya Mudgal",
    "pronouns": "She/Her",
    "experience": "13+ years",
    "bio": "I am a Consultant Psychiatrist at Max Hospital, Gurugram, with over 13 years of specialized clinical experience. My practice focuses on providing comprehensive, empathetic, and evidence-based mental health care for individuals. I specialize in diagnostic assessments and managing mood disorders, anxiety, OCD, depression, stress, adult ADHD, sleep issues, and women's mental health concerns. I believe in a patient-centered, collaborative, and non-judgmental approach to mental wellness that integrates pharmacological interventions with supportive psychotherapeutic counseling.",
    "qualifications": "MBBS, MD (Psychiatry) - Consultant Psychiatrist, Max Hospital Gurugram",
    "languages": "English, Hindi",
    "fees": "Consultation charges vary. For appointments, please call or inquire directly at +91 98919 66440.",
    "link": "https://www.maxhealthcare.in/doctor/dr-soumiya-mugdal"
  },
  {
    "name": "Dr. Raghav Kapoor",
    "pronouns": "He/Him",
    "experience": "14+ years",
    "bio": "I am an Additional Director and Consultant Neurologist at Fortis Escorts Heart Institute, Okhla, New Delhi, with over 14 years of clinical experience. I completed MBBS, MD (General Medicine), and DM (Neurology) from Delhi University. I specialize in comprehensive neurological evaluation, sleep medicine, stroke care, headaches/migraine, and neuro-rehabilitation. I consult on mind-body practices, somatic pathways, and the neurological basis of breathing to foster cognitive resilience and mental well-being.",
    "qualifications": "MBBS, MD, DM (Neurology) - Consultant Neurologist, Fortis Escorts Heart Institute, Okhla",
    "languages": "English, Hindi",
    "fees": "Consultation charges vary. For appointments, please contact Fortis Escorts Heart Institute, Okhla directly.",
    "link": "https://www.fortishealthcare.com/doctor/dr-raghav-kapoor-neurology-4903"
  }
];

export const SPECIALIZED_SESSIONS: SpecializedSession[] = [
  {
    "name": "Group Therapy Sessions & Workshops",
    "description": "Group sessions and workshops on various socio-cultural concerns impacting an individual\u2019s life.",
    "facilitator": "Sessions will be facilitated by trained and qualified Feel Fuzzy Therapists.",
    "languages": "English & Hindi",
    "fees": "Starting at Rs. 0. Goes up to Rs. 1200 per session.",
    "link": "https://feelfuzzy.in/collections/group-therapy"
  },
  {
    "name": "Couple\u2019s Therapy/ Counselling sessions",
    "description": "These 75-90-minute sessions are facilitated by trained couples counselors who can help a couple reflect on their relationship and their partnership",
    "facilitator": "Sessions by trained couples therapists.",
    "languages": "Multiple languages.",
    "fees": "Multiple price points.",
    "link": "https://feelfuzzy.in/collections/couples-therapy"
  }
];

export const HELPLINES: SupportHelpline[] = [
  {
    "name": "Queer-Trans Wellness and Support Center (QT Center) Hyderabad",
    "description": "A space for LGBTQIA+ people to rest, revive, and reclaim. QT Center is a community space for queer trans folks in Hyderabad. Among other things, it offers free mental health services - individual therapy slots and mental health group activities weekly twice using art, mindfulness, movement, and storytelling as a medium. These services are offered in partnership with the mental health organization Pause for Perspective.",
    "contact": "Helpline: 8897533014 theqtcenter@gmail.com",
    "mode": "Face-to-face/ Online Counselling.",
    "fees": "Free of cost/no charges",
    "link": "https://www.instagram.com/theqtcenter/",
    "infoText": "Queer-Trans Wellness and Support Center (QT Center) (@theqtcenter) \u2022 Instagram photos and videos"
  },
  {
    "name": "Samaritans Mumbai",
    "description": "A Suicide Prevention Helpline Samaritans Mumbai is a helpline providing emotional support for those who are stressed, distressed, depressed, or suicidal.",
    "contact": "+91 -8422984528 +91 -8422984529 +91 -8422984530 4 PM-10 PM, all days",
    "mode": "Phone counselling",
    "fees": "Free",
    "link": "https://www.instagram.com/samaritans.mumbai/?hl=en",
    "infoText": "talk2samaritans@gmail.com https://www.instagram.com/samaritans.mumbai/?hl=en"
  },
  {
    "name": "AASRA Helpline",
    "description": "Our free, confidential helpline is answered by professionally trained volunteers. So, whatever your concerns are, you can be rest assured that you will receive non-judgmental and non-critical listening. Please note, the caller's identity is never revealed and none of our calls are recorded or shared. Suicide Prevention Helpline Directory (India)",
    "contact": "+91-9820466726 24 hours, 7 days a week",
    "mode": "Phone counselling",
    "fees": "Free",
    "link": "http://www.aasra.info/helpline.html",
    "infoText": "Languages: English, Hindi http://www.aasra.info/helpline.html"
  },
  {
    "name": "MPower Helpline",
    "description": "MENTAL HEALTH CRISIS HELPLINE NUMBER To deal with depression, anxiety & other mental health concerns.",
    "contact": "1800-120-820050 24 hours, 7 days a week, toll-free number",
    "mode": "Phone counselling",
    "fees": "Free",
    "link": "https://mpowerminds.com/oneonone",
    "infoText": "By Mpower & BMC with Maharashtra Govt https://mpowerminds.com/oneonone"
  },
  {
    "name": "iCall Helpline",
    "description": "iCall is a telephone and email based counselling service run by School of Human Ecology, Tata Institute of Social Sciences, that offers free telephone and email-based counseling services, to individuals in emotional and psychological distress, across age, language, gender, sexual orientation and issues, through a team of qualified and trained mental health professionals.",
    "contact": "+91-9152987821 Monday to Saturday: 10:00 am to 8:00 pm",
    "mode": "Phone counselling",
    "fees": "Free",
    "link": "https://icallhelpline.org",
    "infoText": "https://icallhelpline.org/"
  },
  {
    "name": "Mann Talks Helpline",
    "description": "Free and confidential mental health support Mann Talks offers free and confidential emotional and psychological support through a team of trained mental health professionals. This support is available on email as well as over a phone call.",
    "contact": "+91-8686139 139 9 AM to 8 PM counselling@manntalks.or",
    "mode": "Phone counselling/ Support over email",
    "fees": "Free",
    "link": "https://www.manntalks.org",
    "infoText": "https://www.manntalks.org/"
  }
];

export interface Hospital {
  name: string;
  type: string;
  state: string;
  city: string;
  address: string;
  contact: string;
  emergencyContact: string;
  link: string;
  description: string;
  facilities: string[];
}

export const HOSPITALS: Hospital[] = [
  {
    "name": "NIMHANS (National Institute of Mental Health and Neurosciences)",
    "type": "Neuro-Psychiatric Academic Medical Institute",
    "city": "Bengaluru",
    "state": "Karnataka",
    "address": "Hosur Road, Lakkasandra, Wilson Garden, Bengaluru, Karnataka 560029",
    "contact": "080-26995000 / 26995001 / 26995002",
    "emergencyContact": "080-26995308 (24/7 Psychiatry Emergency)",
    "link": "https://nimhans.ac.in/",
    "description": "NIMHANS is the apex national center for mental health, neurosciences, and allied fields in India. It offers state-of-the-art diagnostics, psychiatric triage, neurological surgery, rehabilitation, and 24/7 clinical emergency services.",
    "facilities": ["24/7 Emergency Triage", "Inpatient Ward (IPD)", "Outpatient Department (OPD)", "De-addiction Center", "Cognitive Rehabilitation", "Child & Adolescent Psychiatry"]
  },
  {
    "name": "IHBAS (Institute of Human Behaviour and Allied Sciences)",
    "type": "Super-Specialty Psychiatric & Neurology Hospital",
    "city": "Delhi",
    "state": "Delhi NCR",
    "address": "Dilshad Garden, Near GTB Hospital, Shahdara, Delhi 110095",
    "contact": "011-29562411 / 29561102",
    "emergencyContact": "011-22597750 (24/7 Emergency Services)",
    "link": "http://ihbas.delhigovt.nic.in/",
    "description": "A premier government-funded super-specialty mental health and neurosciences hospital serving northern India, offering highly accessible psychological counselling, clinical testing, psychiatric stabilization, and legal-clinical aid.",
    "facilities": ["24/7 Psychiatry Emergency", "OPD & Specialized Clinics", "Neuro-imaging (MRI/CT)", "Inpatient Rehabilitation", "Crisis Intervention", "Community Mental Health Clinics"]
  },
  {
    "name": "Central Institute of Psychiatry (CIP)",
    "type": "Government Psychiatric Institution & Hospital",
    "city": "Ranchi",
    "state": "Jharkhand",
    "address": "Kanke, Ranchi, Jharkhand 834006",
    "contact": "0651-2451115 / 2451113",
    "emergencyContact": "0651-2450822 (Psychiatric Helpline)",
    "link": "https://cipranchi.nic.in/",
    "description": "Established in 1918, CIP is a historic and highly regarded national mental health institution offering advanced psychiatric evaluation, clinical psychotherapy, sleep disorder studies, and child guidance clinics.",
    "facilities": ["Advanced Psychiatric Care", "Inpatient & Outpatient Units", "Child Guidance Clinic", "EEG & Neuromodulation", "Family Psychiatric Center", "Rehabilitation & Occupational Therapy"]
  },
  {
    "name": "VIMHANS (Vidyasagar Institute of Mental Health, Neuro & Allied Sciences)",
    "type": "Multi-Specialty Mental Health & Neuro Hospital",
    "city": "Delhi",
    "state": "Delhi NCR",
    "address": "1, Institutional Area, Nehru Nagar, New Delhi, Delhi 110065",
    "contact": "011-26312151 / 26312152",
    "emergencyContact": "011-26312151 (Ext. Emergency)",
    "link": "https://www.vimhans.com/",
    "description": "VIMHANS is a leading private mental health care provider offering holistic therapeutic intervention, neurological sciences, spinal rehabilitation, child development services, and de-addiction therapy.",
    "facilities": ["Psychiatric OPD/IPD", "Neurological Rehabilitation", "Child & Family Therapy", "Somatic Neuromodulation (ECT/rTMS)", "De-addiction & Alcohol Rehab", "Art and Movement Therapy"]
  },
  {
    "name": "Fortis Escorts Heart Institute (Neurology & Psychiatry Department)",
    "type": "Multi-Specialty Private Hospital",
    "city": "Delhi",
    "state": "Delhi NCR",
    "address": "Okhla Road, Opp Holy Family Hospital, New Delhi, Delhi 110025",
    "contact": "011-42776222",
    "emergencyContact": "011-26825002 / +91-9891966440",
    "link": "https://www.fortishealthcare.com/",
    "description": "A world-class multi-specialty institution offering expert consultations in neurological sciences, adult neurology, stroke care, sleep disorders, and neuropsychiatry, guided by expert consultants like Dr. Raghav Kapoor.",
    "facilities": ["Neurology ICU & Stroke Unit", "Outpatient Consultation", "Sleep Medicine Labs", "Neuro-Rehabilitation", "24/7 Trauma & Emergency Center", "Neurodiagnostics"]
  },
  {
    "name": "Max Super Speciality Hospital, Gurugram (Psychiatry & Neurology Dept)",
    "type": "Multi-Specialty Private Hospital",
    "city": "Gurugram",
    "state": "Delhi NCR",
    "address": "B-Block, Sushant Lok Phase I, Near HUDA City Centre, Gurugram, Haryana 122001",
    "contact": "0124-6623000",
    "emergencyContact": "0124-6623111",
    "link": "https://www.maxhealthcare.in/",
    "description": "A top-tier private clinical center featuring robust departments for Brain & Cognitive Sciences, clinical psychiatry, and women's mental health, supported by consultants such as Dr. Soumiya Mudgal.",
    "facilities": ["Psychiatric Consultations", "Neurology & Neurosurgery", "24/7 Emergency Care", "Behavioral Therapy Clinics", "Geriatric Mental Health", "EEG, EMG & NCS Testing"]
  },
  {
    "name": "KEM Hospital (Seth GS Medical College & Psychiatry Dept)",
    "type": "Government General & Teaching Hospital",
    "city": "Mumbai",
    "state": "Maharashtra",
    "address": "Acharya Donde Marg, Parel, Mumbai, Maharashtra 400012",
    "contact": "022-24107000",
    "emergencyContact": "022-24107020 (Casualty & Emergency)",
    "link": "https://www.kem.edu/",
    "description": "One of Mumbai's most prestigious municipal public hospitals. Its Department of Psychiatry is a pioneer in de-addiction treatment, psycho-oncology support, stress management, and low-cost psychiatric inpatient care.",
    "facilities": ["Public OPD & IPD Wards", "De-addiction De-toxification Unit", "Child Guidance Services", "24/7 Free Emergency Triage", "Electroencephalography (EEG)", "Counseling Centers"]
  },
  {
    "name": "Cadabam's Amitha (Psychiatric Rehabilitation Center)",
    "type": "Private Specialty Psychiatric Rehabilitation & Hospital",
    "city": "Bengaluru",
    "state": "Karnataka",
    "address": "Gulakamale Village, Near Taralu Estate, Kaggalipura Post, Kanakapura Road, Bengaluru, Karnataka 560082",
    "contact": "+91-96111 94949",
    "emergencyContact": "+91-97414 76476 (24/7 Crisis Triage)",
    "link": "https://www.cadabams.org/",
    "description": "India’s largest private psychiatric rehabilitation and recovery center. Specialized in schizophrenia recovery, bipolar disorder management, drug de-addiction, and long-term assisted living for chronic mental health conditions.",
    "facilities": ["Inpatient Psychiatric Rehab", "De-addiction & Detox Center", "Supported Living Programs", "Somatic & CBT Therapy Workshops", "24/7 Mental Health Helpline", "Family Support Programs"]
  },
  {
    "name": "SCARF (Schizophrenia Research Foundation)",
    "type": "Specialty Psychiatric Hospital & Research Foundation",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "address": "R-7A, North Main Road, Anna Nagar West Extension, Chennai, Tamil Nadu 600101",
    "contact": "044-26153971 / 26151073",
    "emergencyContact": "044-26153971",
    "link": "https://www.scarfindia.org/",
    "description": "A WHO-collaborating center for mental health. SCARF is highly acclaimed globally for rehabilitation, vocational training, daycare centers, and research on schizophrenia, psychoses, and cognitive impairments.",
    "facilities": ["Symptom Management OPD", "Psychiatric Rehabilitation Ward", "Vocational Training Centers", "Daycare Support Systems", "Mobile Mental Health Clinics", "Cognitive Skill Training"]
  },
  {
    "name": "Christian Medical College (CMC) - Mental Health Centre",
    "type": "Multi-Specialty Charitable & Academic Hospital",
    "city": "Vellore",
    "state": "Tamil Nadu",
    "address": "Bagayam, Vellore, Tamil Nadu 632002",
    "contact": "0416-2282035 / 2282240",
    "emergencyContact": "0416-2282035",
    "link": "https://www.cmch-vellore.edu/",
    "description": "The Department of Psychiatry at CMC Vellore operates a specialized Mental Health Centre at Bagayam. Known for its family-centered treatment models, child and adolescent psychiatry, and top-tier clinical psychology.",
    "facilities": ["Inpatient Family Wards", "Child and Adolescent Psychiatry", "Outpatient Clinics", "Occupational Therapy", "Neurology & Epilepsy Clinics", "Psychometric Testing Labs"]
  },
  {
    "name": "Institute of Mental Health (IMH), Chennai",
    "type": "Government Psychiatric Hospital",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "address": "Medavakkam Tank Road, Kilpauk, Chennai, Tamil Nadu 600010",
    "contact": "044-26423971",
    "emergencyContact": "044-26423971 (Emergency Room)",
    "link": "http://www.imhchennai.com/",
    "description": "One of the oldest and largest government mental hospitals in Asia, providing highly subsidized psychiatric diagnosis, residential care, forensic psychiatry, and rehabilitation services.",
    "facilities": ["Massive Inpatient Capacity", "OPD Psychiatry & Counseling", "De-addiction Wards", "Forensic Psychiatric Evaluation", "Occupational Rehab Programs", "Free General Medicine Clinic"]
  },
  {
    "name": "Institute of Psychiatry (IOP), Kolkata",
    "type": "Government Psychiatric & Academic Hospital",
    "city": "Kolkata",
    "state": "West Bengal",
    "address": "7, D.L. Khan Road, Alipore, Kolkata, West Bengal 700025",
    "contact": "033-22233040 / 22233041",
    "emergencyContact": "033-22233040",
    "link": "https://www.ipgmer.gov.in/",
    "description": "Affiliated with IPGMER and SSKM Hospital, IOP Kolkata is the oldest psychiatric hub in West Bengal, providing specialized psycho-therapy, child psychology clinics, and community psychiatry services.",
    "facilities": ["Mental Health OPD", "Therapeutic Counseling Sessions", "IPD Intensive Mental Care", "Child Guidance Clinics", "Community Psychiatry", "Neuromodulation Center"]
  },
  {
    "name": "IMHANS (Institute of Mental Health and Neurosciences)",
    "type": "Government Neuro-Psychiatric Institute",
    "city": "Kozhikode",
    "state": "Kerala",
    "address": "Government Medical College Campus, Kozhikode, Kerala 673008",
    "contact": "0495-2359352",
    "emergencyContact": "0495-2359352",
    "link": "http://imhans.org/",
    "description": "An autonomous center under the Government of Kerala. IMHANS is committed to advancing community mental health, pediatric neuro-developmental therapies, and affordable psychiatric care in Kerala.",
    "facilities": ["Child Development Center", "Psychotherapy & Counseling", "Community Outreach & Camps", "Autism Spectrum Therapy", "Adult Psychiatric OPD", "Somatic Therapy Units"]
  },
  {
    "name": "Institute of Mental Health (IMH), Erragadda",
    "type": "Government Psychiatric Hospital",
    "city": "Hyderabad",
    "state": "Telangana",
    "address": "Sanjeeva Reddy Nagar, Erragadda, Hyderabad, Telangana 500038",
    "contact": "040-23814441",
    "emergencyContact": "040-23814441 (Psychiatry ER)",
    "link": "https://www.telangana.gov.in/",
    "description": "The primary government-run psychiatric referral facility in Telangana, offering free mental health services, acute stabilization, de-addiction programs, and rehabilitation.",
    "facilities": ["24/7 Acute Crisis Care", "General Inpatient Wards", "De-addiction Programs", "Family Counseling Centers", "Legal-Psychiatric Aid", "OPD Psychiatry"]
  },
  {
    "name": "Medanta - The Medicity (Institute of Neurosciences & Mind Matters)",
    "type": "Multi-Specialty Private Hospital",
    "city": "Gurugram",
    "state": "Delhi NCR",
    "address": "CH Baktawar Singh Road, Sector 38, Gurugram, Haryana 122001",
    "contact": "0124-4141414",
    "emergencyContact": "0124-4141414 (Emergency Helpline)",
    "link": "https://www.medanta.org/",
    "description": "One of India's largest multi-specialty hospitals. Its Division of 'Mind Matters' and Neurological Institute offers highly advanced neuropsychiatry, stroke treatment, neurosurgery, and psychological care.",
    "facilities": ["Integrated Brain ICU", "Neurosurgery & Stereotactic Radiosurgery", "Comprehensive Outpatient Psychiatry", "Cognitive Behavioral Therapy (CBT)", "Advanced Sleep Lab", "Neurological Diagnostics"]
  },
  {
    "name": "Apollo Hospitals, Jubilee Hills (Neurosciences & Psychiatry Dept)",
    "type": "Multi-Specialty Private Hospital",
    "city": "Hyderabad",
    "state": "Telangana",
    "address": "Road No. 72, Opposite Bharatiya Vidya Bhavan, Film Nagar, Jubilee Hills, Hyderabad, Telangana 500033",
    "contact": "040-23607777",
    "emergencyContact": "1066 (Apollo Emergency)",
    "link": "https://hyderabad.apollohospitals.com/",
    "description": "A leading international multi-specialty institution. Its clinical neurosciences division provides top-tier diagnostic imaging, neurology intervention, and outpatient counseling services.",
    "facilities": ["24/7 Emergency Trauma", "Neurophysiology Lab (EEG/EMG)", "Psychiatric Counseling", "Sleep Study Services", "Spinal Therapy & Neurosurgery", "Advanced Stroke Unit"]
  },
  {
    "name": "PGIMER Chandigarh (Department of Psychiatry)",
    "type": "Government Academic & Multi-Specialty Hospital",
    "city": "Chandigarh",
    "state": "Chandigarh & Punjab",
    "address": "Madhya Marg, Sector 12, Chandigarh 160012",
    "contact": "0172-2747585",
    "emergencyContact": "0172-2756112",
    "link": "http://pgimer.edu.in/",
    "description": "PGIMER's Department of Psychiatry is renowned for premium, research-driven clinical services, drug-de-addiction treatment centers, child psychopathology research, and specialized adult consultation.",
    "facilities": ["Highly Specialized Clinics", "Drug De-addiction & Treatment Center (DDTC)", "Child & Adolescent Psychiatry", "IPD Psychiatric Care", "Clinical Psychology Labs", "Emergency Medical Services"]
  },
  {
    "name": "Hospital for Mental Health, Ahmedabad",
    "type": "Government Psychiatric Hospital",
    "city": "Ahmedabad",
    "state": "Gujarat",
    "address": "Near Delhi Darwaja, Outside Delhi Gate, Ahmedabad, Gujarat 380004",
    "contact": "079-25624125",
    "emergencyContact": "079-25624125",
    "link": "https://health.gujarat.gov.in/",
    "description": "The premier government hospital for psychiatric medicine and recovery in Gujarat, offering standard counseling, de-addiction detoxification, and residential psychiatric ward services.",
    "facilities": ["Subsidized Outpatient Care", "Psychiatric Rehabilitation", "Alcohol & Drug Detoxification", "Legal Psychiatric Assistance", "Family Therapy Units", "Occupational Therapy"]
  },
  {
    "name": "SMS Medical College & Hospital (Dept of Psychiatry)",
    "type": "Government General & Academic Hospital",
    "city": "Jaipur",
    "state": "Rajasthan",
    "address": "Jawaharlal Nehru Marg, Gangawal Park, Jaipur, Rajasthan 302004",
    "contact": "0141-2560291",
    "emergencyContact": "0141-2560291 (Ext. Emergency)",
    "link": "https://education.rajasthan.gov.in/smsmc",
    "description": "The largest state-run teaching medical hospital in Rajasthan. Its psychiatry department and psychiatric center provide highly accessible, mass-scale psychiatric OPD, counseling, and inpatient care.",
    "facilities": ["Mass Outpatient Psychiatry", "General Medicine & Trauma", "Inpatient Psychiatric Wards", "Electroconvulsive Therapy (ECT)", "Counseling Centers", "De-addiction Services"]
  },
  {
    "name": "King George's Medical University (KGMU) - Dept of Psychiatry",
    "type": "Government Academic Medical Center",
    "city": "Lucknow",
    "state": "Uttar Pradesh",
    "address": "Shah Mina Road, Chowk, Lucknow, Uttar Pradesh 226003",
    "contact": "0522-2257450 / 2257451",
    "emergencyContact": "0522-2258423 (Trauma & ER)",
    "link": "https://www.kgmu.org/",
    "description": "One of India's oldest and most prestigious state medical universities. The Department of Psychiatry offers comprehensive mental health solutions, child psychology clinics, and modern biological therapies.",
    "facilities": ["Trauma Center & Acute Triage", "IPD Psychiatric Care", "Child Guidance and Adolescent OPD", "De-addiction Unit", "Neurology Reference Centers", "Clinical Psychometrics"]
  },
  {
    "name": "RINPAS (Ranchi Institute of Neuro-Psychiatry & Allied Sciences)",
    "type": "State-Run Neuro-Psychiatric Institute",
    "city": "Ranchi",
    "state": "Jharkhand",
    "address": "Kanke, Ranchi, Jharkhand 834006",
    "contact": "0651-2450303",
    "emergencyContact": "0651-2450303 (ER)",
    "link": "https://rinpas.nic.in/",
    "description": "A leading regional psychiatric center with a century-old history. RINPAS provides advanced clinical neuro-psychiatry, comprehensive diagnostic labs, and dedicated occupational therapy units.",
    "facilities": ["Clinical Neurology & Psychiatry", "Inpatient Psychiatric Care", "Specialized Pathology Labs", "Occupational & Industrial Therapy", "Community Outposts", "Psychological Diagnostics"]
  },
  {
    "name": "LGBRIMH (Lokopriya Gopinath Bordoloi Regional Institute of Mental Health)",
    "type": "National Mental Health Institute",
    "city": "Tezpur",
    "state": "Assam & North East",
    "address": "Tezpur, Sonitpur, Assam 784001",
    "contact": "03712-233340 / 232652",
    "emergencyContact": "03712-233340 (Emergency Helpline)",
    "link": "http://www.lgbrimh.gov.in/",
    "description": "The premier regional central government-funded institute of mental health in North East India. Sprawling campus specialized in psychiatry, psychiatric social work, and psychiatric nursing.",
    "facilities": ["Comprehensive Psychiatric OPD", "Dedicated Inpatient Care", "Child and Adolescent Guidance", "Social Work & Rehabilitation", "EEG & Lab Services", "De-addiction Programs"]
  },
  {
    "name": "Sassoon General Hospital & BJ Medical College (Dept of Psychiatry)",
    "type": "Government Teaching Hospital",
    "city": "Pune",
    "state": "Maharashtra",
    "address": "Near Pune Railway Station, Pune, Maharashtra 411001",
    "contact": "020-26128000",
    "emergencyContact": "020-26128000 (Casualty Dept)",
    "link": "http://bjmc.edu.in/",
    "description": "A massive state-run public hospital in Pune. Offers extensive mental health consultations, forensic assessments, trauma counselling, and subsidized inpatient care for individuals.",
    "facilities": ["Public Psychiatric OPD", "Crisis Counselling & Trauma Care", "General Medicine & Trauma ER", "Inpatient Wards", "De-addiction Counseling", "EEG & Basic Diagnostics"]
  },
  {
    "name": "AIG Hospitals (Department of Psychiatry & Psychology)",
    "type": "Multi-Specialty Private Hospital",
    "city": "Hyderabad",
    "state": "Telangana",
    "address": "P. No. 2/3/4/5, Mindspace Road, Gachibowli, Hyderabad, Telangana 500032",
    "contact": "040-42444444",
    "emergencyContact": "040-42444222",
    "link": "https://aighospitals.com/",
    "description": "A modern private super-specialty hospital. Features highly sophisticated psychological support services, neurological imaging, sleep assessment labs, and integrated psycho-somatic medicine.",
    "facilities": ["Mind & Wellness Consultation", "Advanced Brain Imaging (MRI 3T)", "Neuro-gastroenterology", "24/7 Advanced Emergency Center", "Inpatient Psychological Support", "Cognitive Behavioral Coaching"]
  },
  {
    "name": "All India Institute of Medical Sciences (AIIMS) - Dept of Psychiatry & NDDTC",
    "type": "Government Apex Multi-Specialty & Research Institute",
    "city": "Delhi",
    "state": "Delhi NCR",
    "address": "Ansari Nagar, New Delhi 110029 (NDDTC in Ghaziabad, UP)",
    "contact": "011-26588500 / 26588700",
    "emergencyContact": "011-26594405 (Emergency Psychiatry Room)",
    "link": "https://www.aiims.edu/",
    "description": "India's premier public healthcare institution. Its Department of Psychiatry and the National Drug Dependence Treatment Centre (NDDTC) in Ghaziabad offer unparalleled evidence-based psychiatric intervention, de-addiction programs, and somatic neuroscience therapies.",
    "facilities": ["Apex Psychiatric Triage", "IPD / OPD Units", "National Drug Dependence Treatment Centre", "ECT, rTMS & Somatic Therapies", "Sleep Disorder Studies", "Comprehensive Neuro-radiology"]
  },
  {
    "name": "Kasturba Medical College (KMC) Hospital - Psychiatry Department",
    "type": "Multi-Specialty Charitable & Academic Hospital",
    "city": "Mangaluru",
    "state": "Karnataka",
    "address": "Light House Hill Road, Hampankatta, Mangaluru, Karnataka 575001",
    "contact": "0824-2445858",
    "emergencyContact": "0824-2445858 (Ext. Emergency)",
    "link": "https://www.manipalhospitals.com/mangaluru/",
    "description": "Part of the prestigious Manipal Academy of Higher Education, providing comprehensive clinical psychiatry, psychodynamic therapies, neurological consults, and intensive psychiatric inpatient support.",
    "facilities": ["Psychiatric OPD/IPD", "Neurological Consultation", "Child Guidance Clinic", "Behavioral Rehabilitation", "Speech & Audiology Clinics", "Emergency Trauma Support"]
  },
  {
    "name": "AIIMS Jodhpur (Department of Psychiatry)",
    "type": "Government Apex Multi-Specialty & Research Institute",
    "city": "Jodhpur",
    "state": "Rajasthan",
    "address": "Basni Industrial Area, Phase-2, Jodhpur, Rajasthan 342005",
    "contact": "0291-2740741",
    "emergencyContact": "0291-2740741 (Emergency Triage)",
    "link": "https://www.aiimsjodhpur.edu.in/",
    "description": "A premier central government institution in western India. Its psychiatry division operates modern behavioral health OPDs, child crisis counseling, and highly advanced neurological medicine setups.",
    "facilities": ["24/7 Emergency Triage", "Outpatient Consultation", "Neuromodulation (rTMS)", "Advanced Neuro-imaging", "Substance De-addiction", "Child Guidance & Play Therapy"]
  },
  {
    "name": "Aster Medcity (Department of Psychiatry & Neurology)",
    "type": "Multi-Specialty Private Hospital",
    "city": "Kochi",
    "state": "Kerala",
    "address": "Kuttisahib Road, Near Cheranelloor, Kochi, Kerala 682027",
    "contact": "0484-6699999",
    "emergencyContact": "0484-6690100 (Emergency Desk)",
    "link": "https://www.asterhospitals.in/aster-medcity-kochi",
    "description": "A state-of-the-art private quaternary healthcare center in Kerala, famous for its integrated Brain and Spine institute, neurological rehab services, and empathetic psychological consultations.",
    "facilities": ["Comprehensive Stroke Center", "Advanced Epilepsy Surgery Support", "Neurology & Neurosurgery", "Outpatient Psychology & Counselling", "24/7 Advanced Emergency Triage", "Advanced MRI & Brain Mapping"]
  },
  {
    "name": "IMH (Institute of Mental Health), Amritsar",
    "type": "Government Psychiatric Hospital",
    "city": "Amritsar",
    "state": "Chandigarh & Punjab",
    "address": "Circular Road, Near Government Medical College, Amritsar, Punjab 143001",
    "contact": "0183-2565611",
    "emergencyContact": "0183-2565611",
    "link": "https://www.punjab.gov.in/",
    "description": "The leading historical public mental healthcare center in Punjab, dedicated to providing accessible, subsidized psychiatric care, substance rehabilitation, and community therapy outreach programs.",
    "facilities": ["Subsidized Inpatient Wards", "OPD Psychiatry & Counseling", "Substance Rehabilitation & Recovery", "Forensic Psychiatric Assistance", "Family Guidance Clinic", "EEG Lab Services"]
  },
  {
    "name": "Hospital for Mental Health, Vadodara",
    "type": "Government Psychiatric Hospital",
    "city": "Vadodara",
    "state": "Gujarat",
    "address": "Near Karelibaug Police Station, Karelibaug, Vadodara, Gujarat 390018",
    "contact": "0265-2481024",
    "emergencyContact": "0265-2481024",
    "link": "https://health.gujarat.gov.in/",
    "description": "A long-established government mental health hospital in Gujarat offering psychiatric diagnosis, acute clinical counseling, de-addiction detoxification, and residential psychiatric ward services.",
    "facilities": ["Subsidized Psychiatric OPD", "Inpatient Recovery Wards", "Detoxification & Substance Counseling", "Family Therapy Wards", "Psychological Skill Training", "Occupational Therapy"]
  }
];

