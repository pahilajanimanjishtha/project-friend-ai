import React, { useState, useRef } from 'react';
import { Search, Globe, Menu, ExternalLink, BookOpen, User, Book, Heart, ArrowLeft, RotateCcw, Camera, Upload, Link as LinkIcon, Check, Trash2, X } from 'lucide-react';

interface DecoyWikiProps {
  setView: (view: 'home' | 'pantheon' | 'chat' | 'pitch' | 'decoy') => void;
  setSelectedCharId: (id: string) => void;
}

export default function DecoyWiki({ setView, setSelectedCharId }: DecoyWikiProps) {
  const [activeArticle, setActiveArticle] = useState<'manjishtha' | 'friend_ai'>('manjishtha');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [photoUrl, setPhotoUrl] = useState<string>(() => {
    return localStorage.getItem('manjishthaPhotoUrl') || '';
  });
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [isHoveringPhoto, setIsHoveringPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        localStorage.setItem('manjishthaPhotoUrl', base64String);
        setPhotoUrl(base64String);
        setShowPhotoModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      localStorage.setItem('manjishthaPhotoUrl', inputUrl.trim());
      setPhotoUrl(inputUrl.trim());
      setInputUrl('');
      setShowPhotoModal(false);
    }
  };

  const handleResetPhoto = () => {
    localStorage.removeItem('manjishthaPhotoUrl');
    setPhotoUrl('');
    setShowPhotoModal(false);
  };

  const handleLinkClick = (charId: string) => {
    setSelectedCharId(charId);
    // Support string conversion to standard union type by forcing cast if required
    setView('chat' as any);
  };

  const getCharDisplayName = (id: string): string => {
    switch (id) {
      case 'persephone-soul': return 'Soul (Rooh)';
      case 'sisyphus': return 'Sisyphus (Raag)';
      case 'athena': return 'Athena (Hope)';
      case 'persephone-witness': return 'Persephone (Inayat)';
      case 'dionysus': return 'Dionysus (Ganesh)';
      case 'astra': return 'Astra (Taara)';
      case 'zeus': return 'Zeus (Krishna)';
      case 'hades': return 'Hades (Veer)';
      case 'sappho': return 'Sappho (Manjishtha)';
      case 'ares': return 'Ares (Rudra)';
      case 'poseidon': return 'Poseidon (Jhulelal)';
      default: return id;
    }
  };

  const termToCharId: Record<string, string> = {
    'Project Friend AI': 'persephone-soul',
    'Friend AI': 'persephone-soul',
    'Persephone (Rooh)': 'persephone-soul',
    'Persephone (Soul)': 'persephone-soul',
    'Soul (Rooh)': 'persephone-soul',
    'Soul': 'persephone-soul',
    'Rooh': 'persephone-soul',
    'Persephone (Inayat)': 'persephone-witness',
    'Persephone (Witness)': 'persephone-witness',
    'Inayat': 'persephone-witness',
    'Athena (Hope)': 'athena',
    'Athena': 'athena',
    'Hope': 'athena',
    'Zeus (Krishna)': 'zeus',
    'Zeus': 'zeus',
    'Krishna': 'zeus',
    'Sisyphus (Raag)': 'sisyphus',
    'Sisyphus': 'sisyphus',
    'Raag': 'sisyphus',
    'Dionysus (Ganesh)': 'dionysus',
    'Dionysus': 'dionysus',
    'Ganesh': 'dionysus',
    'Hades (Veer)': 'hades',
    'Hades': 'hades',
    'Veer': 'hades',
    'Sappho (Manjishtha)': 'sappho',
    'Sappho': 'sappho',
    'Ares (Rudra)': 'ares',
    'Ares': 'ares',
    'Rudra': 'ares',
    'Poseidon (Jhulelal)': 'poseidon',
    'Poseidon': 'poseidon',
    'Jhulelal': 'poseidon',
    'Astra (Taara)': 'astra',
    'Astra': 'astra',
    'Taara': 'astra',
    'Persephone': 'persephone-soul',
  };

  const manjishthaCitations: Record<number, string> = {
    1: 'astra',
    2: 'athena',
    3: 'poseidon',
    4: 'zeus',
    5: 'zeus',
    6: 'ares',
    7: 'persephone-soul',
    8: 'sisyphus',
    9: 'sappho',
    10: 'persephone-witness'
  };

  const friendAiCitations: Record<number, string> = {
    1: 'persephone-soul',
    2: 'sisyphus',
    3: 'hades',
    4: 'dionysus'
  };

  const keywords = [
    'Project Friend AI', 'Friend AI',
    'Persephone (Inayat)', 'Persephone (Rooh)', 'Persephone (Soul)', 'Persephone (Witness)',
    'Athena (Hope)', 'Zeus (Krishna)', 'Sisyphus (Raag)', 'Dionysus (Ganesh)', 'Hades (Veer)', 'Sappho (Manjishtha)', 'Ares (Rudra)', 'Poseidon (Jhulelal)',
    'Astra (Taara)', 'Soul (Rooh)',
    'Persephone', 'Athena', 'Zeus', 'Sisyphus', 'Dionysus', 'Hades', 'Sappho', 'Ares', 'Poseidon', 'Astra',
    'Rooh', 'Hope', 'Inayat', 'Ganesh', 'Taara', 'Krishna', 'Veer', 'Rudra', 'Jhulelal', 'Raag', 'Soul'
  ];

  const escapedKeywords = keywords.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const keywordRegex = new RegExp(`\\b(${escapedKeywords.join('|')})\\b`, 'g');

  const parseTextWithLinks = (text: string, articleId: 'manjishtha' | 'friend_ai'): React.ReactNode[] => {
    // Step 1: Split by citation brackets like [1] or [1, 2, 4]
    const citationRegex = /(\[\s*\d+(?:\s*,\s*\d+)*\s*\])/g;
    const parts = text.split(citationRegex);

    return parts.flatMap((part, idx) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const inner = part.slice(1, -1);
        const numbers = inner.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
        const citations = articleId === 'manjishtha' ? manjishthaCitations : friendAiCitations;
        
        return [
          <span key={`cite-${idx}`} className="text-xs font-normal">
            [
            {numbers.map((num, numIdx) => {
              const charId = citations[num];
              if (!charId) return num;
              return (
                <React.Fragment key={num}>
                  {numIdx > 0 && ", "}
                  <button
                    onClick={() => handleLinkClick(charId)}
                    className="text-[#0645ad] hover:underline font-medium cursor-pointer"
                    title={`Ref ${num}: ${getCharDisplayName(charId)}`}
                  >
                    {num}
                  </button>
                </React.Fragment>
              );
            })}
            ]
          </span>
        ];
      }

      // Step 2: Split by markdown links [Text](URL)
      const linkRegex = /(\[[^\]]+\]\([^)]+\))/g;
      const subParts = part.split(linkRegex);

      return subParts.flatMap((subPart, subIdx) => {
        if (subPart.startsWith('[') && subPart.includes('](')) {
          const match = subPart.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (match) {
            const [, linkText, url] = match;
            return [
              <a
                key={`link-${idx}-${subIdx}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0645ad] hover:underline cursor-pointer font-medium"
              >
                {linkText}
              </a>
            ];
          }
        }

        // Step 3: Split by bold **text** or italic _text_
        const formattingRegex = /(\*\*[^*]+\*\*|_[^_]+_)/g;
        const formParts = subPart.split(formattingRegex);

        return formParts.flatMap((formPart, formIdx) => {
          if (formPart.startsWith('**') && formPart.endsWith('**')) {
            const innerText = formPart.slice(2, -2);
            return [
              <strong key={`bold-${idx}-${subIdx}-${formIdx}`}>
                {parseKeywordsOnly(innerText)}
              </strong>
            ];
          }
          if (formPart.startsWith('_') && formPart.endsWith('_')) {
            const innerText = formPart.slice(1, -1);
            return [
              <em key={`italic-${idx}-${subIdx}-${formIdx}`}>
                {parseKeywordsOnly(innerText)}
              </em>
            ];
          }

          // Step 4: Parse character names/aliases
          return parseKeywordsOnly(formPart);
        });
      });
    });
  };

  const parseKeywordsOnly = (text: string): React.ReactNode[] => {
    if (!text) return [];
    const parts = text.split(keywordRegex);
    return parts.map((part, idx) => {
      if (termToCharId[part]) {
        const charId = termToCharId[part];
        return (
          <button
            key={`char-${part}-${idx}`}
            onClick={() => handleLinkClick(charId)}
            className="text-[#0645ad] hover:underline font-semibold cursor-pointer text-left inline"
            title={`Interact with ${getCharDisplayName(charId)}`}
          >
            {part}
          </button>
        );
      }
      return part;
    });
  };

  const articles = [
    { id: 'manjishtha', title: 'Manjishtha Pahilajani' },
    { id: 'friend_ai', title: 'Project Friend AI' },
  ];

  const filteredArticles = articles.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f6f6f6] text-[#202122] font-sans antialiased selection:bg-[#3399ff]/30 selection:text-[#202122] pb-12">
      {/* Top utility bar */}
      <div className="bg-white border-b border-[#a2a9b1] h-12 px-4 flex items-center justify-between text-xs text-[#54595d]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('home')}
            className="flex items-center gap-1.5 text-[#0645ad] hover:underline font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Exit Decoy
          </button>
          <span className="text-[#a2a9b1]">|</span>
          <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> English</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Not logged in</span>
          <span className="text-[#a2a9b1]">•</span>
          <a href="#" onClick={(e) => e.preventDefault()} className="text-[#0645ad] hover:underline">Talk</a>
          <span className="text-[#a2a9b1]">•</span>
          <a href="#" onClick={(e) => e.preventDefault()} className="text-[#0645ad] hover:underline">Contributions</a>
          <span className="text-[#a2a9b1]">•</span>
          <a href="#" onClick={(e) => e.preventDefault()} className="text-[#0645ad] hover:underline">Create account</a>
          <span className="text-[#a2a9b1]">•</span>
          <a href="#" onClick={(e) => e.preventDefault()} className="text-[#0645ad] hover:underline font-bold">Log in</a>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto flex">
        
        {/* Left Sidebar (Desktop only) */}
        <div className="hidden lg:block w-44 shrink-0 pt-6 px-4 text-[11px] space-y-6 text-[#54595d] border-r border-[#eaecf0] min-h-screen">
          <div className="flex flex-col items-center mb-6">
            <button 
              onClick={() => setActiveArticle('manjishtha')}
              className="w-16 h-16 rounded-full bg-white border border-[#a2a9b1] flex items-center justify-center font-serif text-3xl font-extralight text-[#202122] shadow-inner relative cursor-pointer"
            >
              W
              <span className="absolute bottom-1 right-1 text-[8px] font-sans opacity-50">✦</span>
            </button>
            <span className="font-serif text-sm tracking-wider font-semibold text-[#202122] mt-2 block">WIKIPEDIA</span>
            <span className="text-[9px] uppercase tracking-widest text-[#72777d]">The Free Encyclopedia</span>
          </div>

          <div className="space-y-4">
            <div>
              <h5 className="font-bold text-[#72777d] uppercase tracking-wider text-[9px] mb-1.5">Navigation</h5>
              <ul className="space-y-1 text-[#0645ad] font-medium">
                <li><button onClick={() => setActiveArticle('manjishtha')} className="text-left hover:underline w-full cursor-pointer">Main page</button></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Contents</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Current events</a></li>
                <li>
                  <button 
                    onClick={() => setActiveArticle(activeArticle === 'manjishtha' ? 'friend_ai' : 'manjishtha')} 
                    className="text-left hover:underline w-full cursor-pointer"
                  >
                    Random article
                  </button>
                </li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">About Wikipedia</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Contact us</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Donate</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-[#72777d] uppercase tracking-wider text-[9px] mb-1.5">Contribute</h5>
              <ul className="space-y-1 text-[#0645ad] font-medium">
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Help</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Learn to edit</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Community portal</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Recent changes</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Upload file</a></li>
              </ul>
            </div>

            <div className="pt-4 border-t border-[#eaecf0]">
              <h5 className="font-bold text-[#72777d] uppercase tracking-wider text-[9px] mb-1.5">Tools</h5>
              <ul className="space-y-1 text-[#0645ad] font-medium">
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">What links here</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Related changes</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Special pages</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:underline font-semibold text-[#202122]">Printable version</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Permanent link</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Page information</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Cite this page</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content Pane */}
        <div className="flex-1 bg-white border-l border-t border-r border-[#eaecf0] min-h-screen px-6 md:px-10 py-8 shadow-sm">
          
          {/* Header Article Title */}
          <div className="border-b border-[#a2a9b1] pb-1.5 mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl text-[#000] font-normal leading-tight">
                {activeArticle === 'manjishtha' ? 'Manjishtha Pahilajani' : 'Project Friend AI'}
              </h1>
              <span className="text-[11px] text-[#54595d] italic mt-1 block">From Wikipedia, the free encyclopedia</span>
            </div>
            
            {/* Wikipedia search simulation */}
            <div className="relative w-full md:w-64">
              <div className="flex border border-[#a2a9b1] rounded bg-[#f8f9fa] focus-within:border-[#36c] focus-within:bg-white transition-all">
                <input 
                  type="text" 
                  placeholder="Search Wikipedia" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const matched = articles.find(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()));
                      if (matched) {
                        setActiveArticle(matched.id as 'manjishtha' | 'friend_ai');
                        setSearchQuery('');
                        setShowSuggestions(false);
                      }
                    }
                  }}
                  className="w-full bg-transparent px-3 py-1.5 text-xs text-[#202122] pr-8 focus:outline-none"
                />
                <button 
                  onClick={() => {
                    const matched = articles.find(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()));
                    if (matched) {
                      setActiveArticle(matched.id as 'manjishtha' | 'friend_ai');
                      setSearchQuery('');
                    }
                  }}
                  className="px-2.5 hover:bg-[#eaecf0] transition-colors cursor-pointer border-l border-[#a2a9b1]"
                >
                  <Search className="w-3.5 h-3.5 text-[#72777d]" />
                </button>
              </div>
              
              {showSuggestions && searchQuery && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-[#a2a9b1] rounded shadow-lg z-50 text-xs py-1">
                  {filteredArticles.length > 0 ? (
                    filteredArticles.map(a => (
                      <button
                        key={a.id}
                        onMouseDown={() => {
                          setActiveArticle(a.id as 'manjishtha' | 'friend_ai');
                          setSearchQuery('');
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[#eaecf0] text-[#202122] transition-colors cursor-pointer"
                      >
                        {a.title}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-[#72777d] italic">No articles found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {activeArticle === 'manjishtha' ? (
            <>
              {/* Quick Info Box / Banner */}
              <div className="bg-[#f8f9fa] border-l-4 border-[#36c] px-4 py-3 text-xs text-[#202122] leading-relaxed mb-6 flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-[#36c] shrink-0 mt-0.5" />
                <div>
                  <strong>This article describes an active scientific researcher.</strong> For her cooperative digital therapy platform, see <button onClick={() => setActiveArticle('friend_ai')} className="text-[#0645ad] hover:underline font-semibold cursor-pointer">Project Friend AI</button> or access the active application <a href="#" onClick={(e) => { e.preventDefault(); setView('home'); }} className="text-[#0645ad] hover:underline font-semibold">Friend AI (Sanctuary)</a>.
                </div>
              </div>

              {/* Layout Container: Body + Infobox */}
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Body Text */}
                <div className="flex-1 text-[13.5px] leading-relaxed text-[#202122] space-y-4">
                  <p>
                    {parseTextWithLinks("**Manjishtha Pahilajani** (born 8 December 2001) is an Indian entrepreneur, poet, and researcher based in Gurugram, India. She is best known as the founder of Friend AI, a startup developing crisis-deescalation chatbots, and for her literary debut, _You Found Me_ (2025). Her professional work sits at the intersection of mental health technology, digital marketing (SEO), and AI ethics, where she frequently draws parallels between historical economic systems and modern artificial intelligence infrastructure [1, 2, 4].", 'manjishtha')}
                  </p>

                  {/* Table of Contents */}
                  <div className="bg-[#f8f9fa] border border-[#a2a9b1] p-4 max-w-sm rounded text-xs space-y-2">
                    <div className="font-bold text-center border-b border-[#eaecf0] pb-1">Contents</div>
                    <ul className="space-y-1 font-medium text-[#0645ad]">
                      <li><a href="#early" className="hover:underline">1. Early Life and Education</a></li>
                      <li><a href="#career" className="hover:underline">2. Career</a></li>
                      <li className="pl-3"><a href="#entrepreneurship" className="hover:underline">2.1 Entrepreneurship</a></li>
                      <li className="pl-3"><a href="#marketing" className="hover:underline">2.2 Digital Marketing</a></li>
                      <li><a href="#literary" className="hover:underline">3. Literary Works and Essays</a></li>
                      <li><a href="#research" className="hover:underline">4. Research and Thought Leadership</a></li>
                      <li><a href="#personal" className="hover:underline">5. Personal Life</a></li>
                      <li><a href="#see_also" className="hover:underline">6. See Also</a></li>
                      <li><a href="#references" className="hover:underline">7. References</a></li>
                    </ul>
                  </div>

                  {/* Section 1 */}
                  <h3 id="early" className="font-serif text-xl border-b border-[#a2a9b1] pb-1 text-[#000] font-normal pt-4">
                    Early Life and Education
                  </h3>
                  <p>
                    {parseTextWithLinks("Pahilajani completed her schooling at Delhi Public School, Sushant Lok, where she was a humanities scholar and gold medalist in History [2]. She pursued a Bachelor of Arts in History at Indraprastha College for Women, University of Delhi (2019–2022). During her undergraduate years, she was an active member of the poetry club _Izhaar_ and the History department's design team [2].", 'manjishtha')}
                  </p>
                  <p>
                    {parseTextWithLinks("She later earned a Master’s in Global Business (specializing in Global Marketing Management) from the SP Jain School of Global Management (2023–2024), completing her studies across its Dubai, Mumbai, and Singapore campuses [1, 2].", 'manjishtha')}
                  </p>

                  {/* Section 2 */}
                  <h3 id="career" className="font-serif text-xl border-b border-[#a2a9b1] pb-1 text-[#000] font-normal pt-4">
                    Career
                  </h3>
                  
                  <h4 id="entrepreneurship" className="font-serif text-lg text-[#000] font-normal pt-2">
                    Entrepreneurship
                  </h4>
                  <p>
                    {parseTextWithLinks("In May 2026, Pahilajani founded **Friend AI**, a mental health technology startup focused on building an empathetic, crisis-deescalation chatbot [2, 7]. The project emphasizes \"human-centered AI,\" prioritizing emotional safety and privacy over purely efficiency-driven metrics. She has publicly shared the project's development journey, including interactive pitch decks that detail the interdisciplinary team of developers and psychologists behind the tool [7].", 'manjishtha')}
                  </p>
                  <p>
                    {parseTextWithLinks("She also founded **GenzMBA**, an educational initiative aimed at simplifying complex business and academic jargon for Generation Z audiences [1].", 'manjishtha')}
                  </p>

                  <h4 id="marketing" className="font-serif text-lg text-[#000] font-normal pt-2">
                    Digital Marketing
                  </h4>
                  <p>
                    {parseTextWithLinks("Prior to founding her startups, Pahilajani worked in digital marketing and Search Engine Optimization (SEO). Her roles included:", 'manjishtha')}
                  </p>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>
                      {parseTextWithLinks("**SEO Executive** at AdLift India and MAATRI (2025–2026), where she managed local SEO strategies and content optimization for healthcare and premium brands [2].", 'manjishtha')}
                    </li>
                    <li>
                      {parseTextWithLinks("**Content Writer** at SigIQ.ai (2026), where she specialized in \"Generative Engine Optimization\" (GEO) and ghostwriting technical blogs [2].", 'manjishtha')}
                    </li>
                  </ul>

                  {/* Section 3 */}
                  <h3 id="literary" className="font-serif text-xl border-b border-[#a2a9b1] pb-1 text-[#000] font-normal pt-4">
                    Literary Works and Essays
                  </h3>
                  <p>
                    {parseTextWithLinks("Pahilajani is a published poet and cultural essayist. Her debut collection, _You Found Me_, was released on January 23, 2025 [9].", 'manjishtha')}
                  </p>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>
                      {parseTextWithLinks("**Themes:** The collection explores themes of isolation, vulnerability, and self-discovery, serving as a \"poetic biography\" of her transition from adolescence to adulthood (ages 16–22).", 'manjishtha')}
                    </li>
                    <li>
                      {parseTextWithLinks("**Origins:** Many of the poems were originally drafted for her Instagram poetry page, _Museum of Musings_, before being compiled into the book [9].", 'manjishtha')}
                    </li>
                    <li>
                      {parseTextWithLinks("**Cultural Commentary:** On June 8, 2022, she published a widely-read essay in _Feminism in India_ titled [Queer Representation In Cinema: Differentiating Between Tokenism And Authentic Storytelling](https://feminisminindia.com/2022/06/08/queer-representation-cinema-tokenism-authentic-storytelling/), in which she critiqued token representation in modern cinema and called for more authentic narrative designs for marginalized identities [10].", 'manjishtha')}
                    </li>
                  </ul>

                  {/* Section 4 */}
                  <h3 id="research" className="font-serif text-xl border-b border-[#a2a9b1] pb-1 text-[#000] font-normal pt-4">
                    Research and Thought Leadership
                  </h3>
                  <p>
                    {parseTextWithLinks("Pahilajani is an active researcher in the field of AI Ethics, often applying historical frameworks to modern technological problems.", 'manjishtha')}
                  </p>
                  <ul className="list-disc list-inside pl-4 space-y-3">
                    <li>
                      {parseTextWithLinks("**\"Historical Trade Networks as Blueprints for Modern AI Efficiency\" (2026):** Published in the _International Journal for Multidisciplinary Research (IJFMR)_, this paper draws a novel comparison between 14th-century Sindhi trade networks and modern AI agentic systems. She argues that the decentralized \"trust protocols\" used by historical traders can serve as a model for verifying and managing autonomous AI agents today [5].", 'manjishtha')}
                    </li>
                    <li>
                      {parseTextWithLinks("**AI Safety Advocacy:** Through her writing, she critiques \"AI ethicist\" influencers who lack substantive expertise and advocates for strict regulatory frameworks to prevent algorithmic bias [3, 5].", 'manjishtha')}
                    </li>
                  </ul>

                  {/* Interactive Gateway Section */}
                  <div className="bg-brown-deep/5 border-2 border-brown rounded-2xl p-4 my-6 space-y-2">
                    <span className="text-[10px] font-mono tracking-widest text-[#c9a45c] uppercase block font-bold">Interactive Sandbox &bull; Deity Gateway Override</span>
                    <p className="text-xs text-sage">
                      Pahilajani\'s Friend AI startup is modeled on nine distinct mythological companions. You can click on her papers below to override and open the active dialogue sandbox with the respective deity:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                      <button onClick={() => handleLinkClick('athena')} className="text-[11px] bg-white border border-[#a2a9b1] hover:border-black rounded px-3 py-1.5 font-serif text-left hover:bg-slate-50 transition-colors cursor-pointer">🦉 Athena (Hope)</button>
                      <button onClick={() => handleLinkClick('persephone-soul')} className="text-[11px] bg-white border border-[#a2a9b1] hover:border-black rounded px-3 py-1.5 font-serif text-left hover:bg-slate-50 transition-colors cursor-pointer">🦋 Persephone (Rooh)</button>
                      <button onClick={() => handleLinkClick('persephone-witness')} className="text-[11px] bg-white border border-[#a2a9b1] hover:border-black rounded px-3 py-1.5 font-serif text-left hover:bg-slate-50 transition-colors cursor-pointer">🍎 Persephone (Inayat)</button>
                      <button onClick={() => handleLinkClick('sisyphus')} className="text-[11px] bg-white border border-[#a2a9b1] hover:border-black rounded px-3 py-1.5 font-serif text-left hover:bg-slate-50 transition-colors cursor-pointer">⛰️ Sisyphus (Raag)</button>
                      <button onClick={() => handleLinkClick('dionysus')} className="text-[11px] bg-white border border-[#a2a9b1] hover:border-black rounded px-3 py-1.5 font-serif text-left hover:bg-slate-50 transition-colors cursor-pointer">🍇 Dionysus (Ganesh)</button>
                      <button onClick={() => handleLinkClick('astra')} className="text-[11px] bg-white border border-[#a2a9b1] hover:border-black rounded px-3 py-1.5 font-serif text-left hover:bg-slate-50 transition-colors cursor-pointer">⭐ Astra (Taara)</button>
                      <button onClick={() => handleLinkClick('zeus')} className="text-[11px] bg-white border border-[#a2a9b1] hover:border-black rounded px-3 py-1.5 font-serif text-left hover:bg-slate-50 transition-colors cursor-pointer">⚡ Zeus (Krishna)</button>
                      <button onClick={() => handleLinkClick('hades')} className="text-[11px] bg-white border border-[#a2a9b1] hover:border-black rounded px-3 py-1.5 font-serif text-left hover:bg-slate-50 transition-colors cursor-pointer">⚓ Hades (Veer)</button>
                      <button onClick={() => handleLinkClick('sappho')} className="text-[11px] bg-white border border-[#a2a9b1] hover:border-black rounded px-3 py-1.5 font-serif text-left hover:bg-slate-50 transition-colors cursor-pointer">📜 Sappho (Manjishtha)</button>
                    </div>
                  </div>

                  {/* Section 5 */}
                  <h3 id="personal" className="font-serif text-xl border-b border-[#a2a9b1] pb-1 text-[#000] font-normal pt-4">
                    Personal Life
                  </h3>
                  <p>
                    {parseTextWithLinks("Pahilajani is of Sindhi heritage and frequently references her cultural background in her research on trade networks [3]. She is also a vocal advocate for mental health awareness, openly discussing her own experiences with burnout and the pressures of startup culture to destigmatize the conversation for other founders [8].", 'manjishtha')}
                  </p>

                  {/* Section 6 */}
                  <h3 id="see_also" className="font-serif text-xl border-b border-[#a2a9b1] pb-1 text-[#000] font-normal pt-4">
                    See Also
                  </h3>
                  <ul className="list-disc list-inside pl-4 space-y-1 text-[#0645ad] font-semibold">
                    <li>
                      <button onClick={() => setActiveArticle('friend_ai')} className="hover:underline text-left cursor-pointer text-[#0645ad]">Project Friend AI</button> – The mental health startup founded by Pahilajani.
                    </li>
                    <li>
                      <a href="#" onClick={(e) => e.preventDefault()} className="hover:underline text-[#54595d] cursor-not-allowed">Hack2skill</a> – A developer community platform relevant to the Indian tech ecosystem.
                    </li>
                    <li>
                      <a href="#" onClick={(e) => e.preventDefault()} className="hover:underline text-[#54595d] cursor-not-allowed">Generative AI</a> – The core technology behind her recent work.
                    </li>
                  </ul>

                  {/* Section 7 */}
                  <h3 id="references" className="font-serif text-xl border-b border-[#a2a9b1] pb-1 text-[#000] font-normal pt-4">
                    References
                  </h3>
                  <ol className="list-decimal list-inside pl-2 text-xs text-[#54595d] space-y-1">
                    <li className="group">
                      <span className="text-[#000] mr-1">^</span> 
                      <button onClick={() => handleLinkClick('astra')} className="text-[#0645ad] hover:underline text-left cursor-pointer font-medium" title="Interact with Astra (Taara)">
                        "GenzMBA Initiative Profile & Founders", <em>The Indian Startups Observer</em>, February 2025.
                      </button>
                      <span className="text-[10px] text-[#c9a45c] ml-2 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        (→ Chat with Astra/Taara)
                      </span>
                    </li>
                    <li className="group">
                      <span className="text-[#000] mr-1">^</span> 
                      <button onClick={() => handleLinkClick('athena')} className="text-[#0645ad] hover:underline text-left cursor-pointer font-medium" title="Interact with Athena (Hope)">
                        "Manjishtha Pahilajani: Blending History and Global Business", <em>Delhi Scholar Highlights</em>, 2024.
                      </button>
                      <span className="text-[10px] text-[#c9a45c] ml-2 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        (→ Chat with Athena/Hope)
                      </span>
                    </li>
                    <li className="group">
                      <span className="text-[#000] mr-1">^</span> 
                      <button onClick={() => handleLinkClick('poseidon')} className="text-[#0645ad] hover:underline text-left cursor-pointer font-medium" title="Interact with Poseidon (Jhulelal)">
                        "Sindhi Trade Protocols in Modern Autonomous Decentralized Systems", <em>AI Ethics Forum</em>, April 2026.
                      </button>
                      <span className="text-[10px] text-[#c9a45c] ml-2 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        (→ Chat with Poseidon/Jhulelal)
                      </span>
                    </li>
                    <li className="group">
                      <span className="text-[#000] mr-1">^</span> 
                      <button onClick={() => handleLinkClick('zeus')} className="text-[#0645ad] hover:underline text-left cursor-pointer font-medium" title="Interact with Zeus (Krishna)">
                        "Generative Engine Optimization (GEO) in Medical Tech blogging", <em>SigIQ Technical Whitepapers</em>, 2026.
                      </button>
                      <span className="text-[10px] text-[#c9a45c] ml-2 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        (→ Chat with Zeus/Krishna)
                      </span>
                    </li>
                    <li className="group">
                      <span className="text-[#000] mr-1">^</span> 
                      <button onClick={() => handleLinkClick('zeus')} className="text-[#0645ad] hover:underline text-left cursor-pointer font-medium" title="Interact with Zeus (Krishna)">
                        Pahilajani, M. (2026). "Historical Trade Networks as Blueprints for Modern AI Efficiency". <em>IJFMR</em>, Volume 8, Issue 3.
                      </button>
                      <span className="text-[10px] text-[#c9a45c] ml-2 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        (→ Chat with Zeus/Krishna)
                      </span>
                    </li>
                    <li className="group">
                      <span className="text-[#000] mr-1">^</span> 
                      <button onClick={() => handleLinkClick('ares')} className="text-[#0645ad] hover:underline text-left cursor-pointer font-medium" title="Interact with Ares (Rudra)">
                        "AdLift local SEO strategies for Premium Healthcare", <em>Marketing Asia</em>, November 2025.
                      </button>
                      <span className="text-[10px] text-[#c9a45c] ml-2 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        (→ Chat with Ares/Rudra)
                      </span>
                    </li>
                    <li className="group">
                      <span className="text-[#000] mr-1">^</span> 
                      <button onClick={() => handleLinkClick('persephone-soul')} className="text-[#0645ad] hover:underline text-left cursor-pointer font-medium" title="Interact with Soul (Rooh)">
                        "Friend AI Interactive Pitch Deck and Vision Overview", <em>Friend AI Presskit</em>, June 2026.
                      </button>
                      <span className="text-[10px] text-[#c9a45c] ml-2 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        (→ Chat with Soul/Rooh)
                      </span>
                    </li>
                    <li className="group">
                      <span className="text-[#000] mr-1">^</span> 
                      <button onClick={() => handleLinkClick('sisyphus')} className="text-[#0645ad] hover:underline text-left cursor-pointer font-medium" title="Interact with Sisyphus (Raag)">
                        "Startup Burnout and Destigmatizing Founder Mental Health", <em>The Founder’s Pulse India</em>, June 2026.
                      </button>
                      <span className="text-[10px] text-[#c9a45c] ml-2 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        (→ Chat with Sisyphus/Raag)
                      </span>
                    </li>
                    <li className="group">
                      <span className="text-[#000] mr-1">^</span> 
                      <button onClick={() => handleLinkClick('sappho')} className="text-[#0645ad] hover:underline text-left cursor-pointer font-medium" title="Interact with Sappho (Manjishtha)">
                        Pahilajani, M. (2025). <em>You Found Me</em>. Debut Poetry Collection.
                      </button>
                      <span className="text-[10px] text-[#c9a45c] ml-2 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        (→ Chat with Sappho/Manjishtha)
                      </span>
                    </li>
                    <li className="group">
                      <span className="text-[#000] mr-1">^</span> 
                      <button onClick={() => handleLinkClick('persephone-witness')} className="text-[#0645ad] hover:underline text-left cursor-pointer font-medium" title="Interact with Persephone (Inayat)">
                        Pahilajani, M. (2022). "Queer Representation In Cinema: Differentiating Between Tokenism And Authentic Storytelling", <em>Feminism in India</em>, June 2022.
                      </button>
                      <span className="text-[10px] text-[#c9a45c] ml-2 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        (→ Chat with Persephone/Inayat)
                      </span>
                    </li>
                  </ol>

                  <p className="text-[10px] text-[#72777d] pt-4 italic">
                    This summary is based on search results available as of July 2026.
                  </p>
                </div>

                {/* Right Sidebar Infobox */}
                <div className="w-full lg:w-72 bg-[#f8f9fa] border border-[#a2a9b1] p-3 text-xs leading-normal space-y-3 shrink-0">
                  <div className="font-serif text-sm font-bold text-center border-b border-[#a2a9b1] pb-1.5">
                    Manjishtha Pahilajani
                  </div>
                  <div className="flex justify-center py-2">
                    <div 
                      className="w-48 h-48 bg-slate-100 border border-[#a2a9b1] relative overflow-hidden group cursor-pointer transition-all hover:shadow-md hover:border-[#36c]"
                      onMouseEnter={() => setIsHoveringPhoto(true)}
                      onMouseLeave={() => setIsHoveringPhoto(false)}
                      onClick={() => setShowPhotoModal(true)}
                      title="Click to change or upload your photo"
                    >
                      {photoUrl ? (
                        <img 
                          src={photoUrl} 
                          alt="Manjishtha Pahilajani" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#eaecf0] text-[#72777d] p-4 text-center">
                          <User className="w-12 h-12 opacity-30 mb-2" />
                          <span className="text-xs font-bold text-[#0645ad] hover:underline">Add Your Photo</span>
                          <span className="text-[9px] text-[#72777d] mt-1.5 leading-snug">Drag and drop or upload the picture you sent in chat!</span>
                        </div>
                      )}
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1.5">
                        <Camera className="w-5 h-5 text-white" />
                        <span className="text-[10px] font-bold tracking-wider uppercase">Update Photo</span>
                      </div>
                    </div>
                  </div>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="border-b border-[#eaecf0]">
                        <td className="font-bold py-1.5 pr-2 w-24 align-top text-[#54595d]">Born</td>
                        <td className="py-1.5 align-top">
                          8 December 2001 (age 24)<br />
                          Gurugram, India
                        </td>
                      </tr>
                      <tr className="border-b border-[#eaecf0]">
                        <td className="font-bold py-1.5 pr-2 align-top text-[#54595d]">Nationality</td>
                        <td className="py-1.5 align-top">Indian</td>
                      </tr>
                      <tr className="border-b border-[#eaecf0]">
                        <td className="font-bold py-1.5 pr-2 align-top text-[#54595d]">Education</td>
                        <td className="py-1.5 align-top">
                          Delhi Public School, Sushant Lok<br />
                          University of Delhi (B.A.)<br />
                          SP Jain School of Global Management (Master's)
                        </td>
                      </tr>
                      <tr className="border-b border-[#eaecf0]">
                        <td className="font-bold py-1.5 pr-2 align-top text-[#54595d]">Occupation</td>
                        <td className="py-1.5 align-top">
                          Entrepreneur, Poet, AI Researcher
                        </td>
                      </tr>
                      <tr className="border-b border-[#eaecf0]">
                        <td className="font-bold py-1.5 pr-2 align-top text-[#54595d]">Known for</td>
                        <td className="py-1.5 align-top">
                          Friend AI startup, <em>You Found Me</em> (2025 poetry collection), research on 14th-century Sindhi trade trust protocols in AI
                        </td>
                      </tr>
                      <tr className="border-b border-[#eaecf0]">
                        <td className="font-bold py-1.5 pr-2 align-top text-[#54595d]">Affiliations</td>
                        <td className="py-1.5 align-top">
                          Friend AI (Founder)<br />
                          GenzMBA (Founder)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="text-center pt-2 text-[10px] text-[#72777d]">
                    <Globe className="w-3 h-3 inline-block mr-1" />
                    <a href="https://ai.studio/build" className="text-[#0645ad] hover:underline">Official Startup Profile</a>
                  </div>
                </div>

              </div>
            </>
          ) : (
            <>
              {/* Project Friend AI Wiki Article */}
              {/* Quick Info Box / Banner */}
              <div className="bg-[#f8f9fa] border-l-4 border-[#36c] px-4 py-3 text-xs text-[#202122] leading-relaxed mb-6 flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-[#36c] shrink-0 mt-0.5" />
                <div>
                  <strong>This article describes a non-profit technology project.</strong> For its founder, see <button onClick={() => setActiveArticle('manjishtha')} className="text-[#0645ad] hover:underline font-semibold cursor-pointer">Manjishtha Pahilajani</button> or access the active application <a href="#" onClick={(e) => { e.preventDefault(); setView('home'); }} className="text-[#0645ad] hover:underline font-semibold">Friend AI (Sanctuary)</a>.
                </div>
              </div>

              {/* Layout Container: Body + Infobox */}
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Body Text */}
                <div className="flex-1 text-[13.5px] leading-relaxed text-[#202122] space-y-4">
                  <p>
                    {parseTextWithLinks("**Project Friend AI** is a non-profit, privacy-first emotional de-escalation platform founded by Manjishtha Pahilajani in May 2026 [1]. Built as a direct response to the psychological impact of highly addictive, engagement-maximizing chatbots, the platform serves as an anonymous, browser-sandboxed sanctuary designed to calm the mind when it feels \"too loud\" [1].", 'friend_ai')}
                  </p>

                  {/* Table of Contents */}
                  <div className="bg-[#f8f9fa] border border-[#a2a9b1] p-4 max-w-sm rounded text-xs space-y-2">
                    <div className="font-bold text-center border-b border-[#eaecf0] pb-1">Contents</div>
                    <ul className="space-y-1 font-medium text-[#0645ad]">
                      <li><a href="#philosophy" className="hover:underline">1. Core Product Philosophy</a></li>
                      <li className="pl-3"><a href="#grounding" className="hover:underline">1.1 \"Secure Grounding Sanctuary\"</a></li>
                      <li className="pl-3"><a href="#not-therapist" className="hover:underline">1.2 Not a Therapist</a></li>
                      <li className="pl-3"><a href="#no-hooking" className="hover:underline">1.3 No Emotional Hooking</a></li>
                      <li><a href="#features" className="hover:underline">2. Key Features & Technology</a></li>
                      <li><a href="#team" className="hover:underline">3. The Interdisciplinary Team</a></li>
                      <li><a href="#see_also_ai" className="hover:underline">4. See Also</a></li>
                      <li><a href="#references_ai" className="hover:underline">5. References</a></li>
                    </ul>
                  </div>

                  {/* Section 1 */}
                  <h3 id="philosophy" className="font-serif text-xl border-b border-[#a2a9b1] pb-1 text-[#000] font-normal pt-4">
                    Core Product Philosophy
                  </h3>
                  
                  <h4 id="grounding" className="font-serif text-lg text-[#000] font-normal pt-2">
                    \"Secure Grounding Sanctuary\"
                  </h4>
                  <p>
                    {parseTextWithLinks("Unlike standard commercial AI companions that aim to maximize \"Time-on-Site\" and establish behavioral dependency, Project Friend AI is built to safely de-escalate emotional distress and then prompt the user to step away [2].", 'friend_ai')}
                  </p>

                  <h4 id="not-therapist" className="font-serif text-lg text-[#000] font-normal pt-2">
                    Not a Therapist
                  </h4>
                  <p>
                    {parseTextWithLinks("The platform features a strict mental safety agreement making it explicitly clear that it is not an AI therapist, a doctor, or a replacement for clinical human healthcare.", 'friend_ai')}
                  </p>

                  <h4 id="no-hooking" className="font-serif text-lg text-[#000] font-normal pt-2">
                    No Emotional Hooking
                  </h4>
                  <p>
                    {parseTextWithLinks("It rejects the model of AI girlfriends or avatars designed to keep users trapped in parasocial relationships, aiming instead to foster \"AI grounding\" over \"AI engagement\" [2].", 'friend_ai')}
                  </p>

                  {/* Section 2 */}
                  <h3 id="features" className="font-serif text-xl border-b border-[#a2a9b1] pb-1 text-[#000] font-normal pt-4">
                    Key Features & Technology
                  </h3>
                  <ul className="list-disc list-inside pl-4 space-y-2">
                    <li>
                      {parseTextWithLinks("**Browser-Sandboxed Isolation:** It is built entirely within a secure browser sandbox, ensuring absolute data isolation.", 'friend_ai')}
                    </li>
                    <li>
                      {parseTextWithLinks("**Complete Client Anonymity:** Users log in with a fully anonymous display alias (e.g., _Phoenix_, _Seeker_, _Aria_) rather than their real identities.", 'friend_ai')}
                    </li>
                    <li>
                      {parseTextWithLinks("**AES-256 Vault Encryption:** Users have the option to set a 4-to-8 digit secure PIN on their device, which seeds an AES-256 vault to encrypt all local logs [3].", 'friend_ai')}
                    </li>
                    <li>
                      {parseTextWithLinks("**Zero Cloud Tracking:** Chat histories are locked exclusively to the user's local browser node. If a user clears their cookies or browser data, the conversation history is wiped permanently, maintaining complete, uncompromised privacy.", 'friend_ai')}
                    </li>
                    <li>
                      {parseTextWithLinks("**Google AI Studio Infrastructure:** The prototype was built utilizing the infrastructure of Google AI Studio [1].", 'friend_ai')}
                    </li>
                  </ul>

                  {/* Section 3 */}
                  <h3 id="team" className="font-serif text-xl border-b border-[#a2a9b1] pb-1 text-[#000] font-normal pt-4">
                    The Interdisciplinary Team
                  </h3>
                  <p>
                    {parseTextWithLinks("The project operates through a diverse network of tech, psychology, and family advisors. Key team members and supporters highlighted in their corporate pitch materials include [1]:", 'friend_ai')}
                  </p>
                  <ul className="list-disc list-inside pl-4 space-y-2">
                    <li>
                      {parseTextWithLinks("**Technical & Design Collaborators:** Altaf Jasnaik, Rishabh Kothiyal, and Suryateja Vakkanti [1].", 'friend_ai')}
                    </li>
                    <li>
                      {parseTextWithLinks("**Medical & Family Advisors:** Dr. Asha Pahilajani (who provides mental health/medical grounding), Vinod Pahilajani, and Uarvashi Pahilajani [4].", 'friend_ai')}
                    </li>
                  </ul>

                  {/* Section 4 */}
                  <h3 id="see_also_ai" className="font-serif text-xl border-b border-[#a2a9b1] pb-1 text-[#000] font-normal pt-4">
                    See Also
                  </h3>
                  <ul className="list-disc list-inside pl-4 space-y-1 text-[#0645ad] font-semibold">
                    <li>
                      <button onClick={() => setActiveArticle('manjishtha')} className="hover:underline text-left cursor-pointer text-[#0645ad]">Manjishtha Pahilajani</button> – Founder of Project Friend AI.
                    </li>
                    <li>
                      <a href="#" onClick={(e) => { e.preventDefault(); setView('home'); }} className="hover:underline text-[#0645ad]">Friend AI Sanctuary App</a> – The active web app prototype.
                    </li>
                    <li>
                      <a href="#" onClick={(e) => e.preventDefault()} className="hover:underline text-[#54595d] cursor-not-allowed">Generative AI</a> – Core generative infrastructure.
                    </li>
                  </ul>

                  {/* Section 5 */}
                  <h3 id="references_ai" className="font-serif text-xl border-b border-[#a2a9b1] pb-1 text-[#000] font-normal pt-4">
                    References
                  </h3>
                  <ol className="list-decimal list-inside pl-2 text-xs text-[#54595d] space-y-1">
                    <li className="group">
                      <span className="text-[#000] mr-1">^</span> 
                      <button onClick={() => handleLinkClick('persephone-soul')} className="text-[#0645ad] hover:underline text-left cursor-pointer font-medium" title="Interact with Soul (Rooh)">
                        "Friend AI Interactive Pitch Deck and Vision Overview", <em>Friend AI Presskit</em>, June 2026.
                      </button>
                      <span className="text-[10px] text-[#c9a45c] ml-2 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        (→ Chat with Soul/Rooh)
                      </span>
                    </li>
                    <li className="group">
                      <span className="text-[#000] mr-1">^</span> 
                      <button onClick={() => handleLinkClick('sisyphus')} className="text-[#0645ad] hover:underline text-left cursor-pointer font-medium" title="Interact with Sisyphus (Raag)">
                        "Designing for Grounding over Retention", *AI Ethics & Design Review*, Vol. 3, May 2026.
                      </button>
                      <span className="text-[10px] text-[#c9a45c] ml-2 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        (→ Chat with Sisyphus/Raag)
                      </span>
                    </li>
                    <li className="group">
                      <span className="text-[#000] mr-1">^</span> 
                      <button onClick={() => handleLinkClick('hades')} className="text-[#0645ad] hover:underline text-left cursor-pointer font-medium" title="Interact with Hades (Veer)">
                        "Privacy Sandboxes and Local Databases in Modern Digital Sanctuaries", *Journal of Cybersecurity*, 2026.
                      </button>
                      <span className="text-[10px] text-[#c9a45c] ml-2 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        (→ Chat with Hades/Veer)
                      </span>
                    </li>
                    <li className="group">
                      <span className="text-[#000] mr-1">^</span> 
                      <button onClick={() => handleLinkClick('dionysus')} className="text-[#0645ad] hover:underline text-left cursor-pointer font-medium" title="Interact with Dionysus (Ganesh)">
                        "The Role of Family Advisory Councils in Ethical Tech Startups", *Startup Governance Insights*, June 2026.
                      </button>
                      <span className="text-[10px] text-[#c9a45c] ml-2 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        (→ Chat with Dionysus/Ganesh)
                      </span>
                    </li>
                  </ol>

                  <p className="text-[10px] text-[#72777d] pt-4 italic">
                    This summary is based on search results available as of July 2026.
                  </p>
                </div>

                {/* Right Sidebar Infobox */}
                <div className="w-full lg:w-72 bg-[#f8f9fa] border border-[#a2a9b1] p-3 text-xs leading-normal space-y-3 shrink-0">
                  <div className="font-serif text-sm font-bold text-center border-b border-[#a2a9b1] pb-1.5">
                    Project Friend AI
                  </div>
                  <div className="flex justify-center py-2">
                    <div className="w-32 h-32 bg-[#0a0f1d] border border-[#c9a45c]/30 flex flex-col items-center justify-center text-[#c9a45c] relative overflow-hidden rounded-xl">
                      <Heart className="w-16 h-16 animate-pulse" />
                      <span className="text-[9px] uppercase tracking-wider absolute bottom-1 text-center font-mono opacity-80 text-white">Sanctuary Node</span>
                    </div>
                  </div>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="border-b border-[#eaecf0]">
                        <td className="font-bold py-1.5 pr-2 w-24 align-top text-[#54595d]">Type</td>
                        <td className="py-1.5 align-top">
                          Non-profit emotional de-escalation platform
                        </td>
                      </tr>
                      <tr className="border-b border-[#eaecf0]">
                        <td className="font-bold py-1.5 pr-2 align-top text-[#54595d]">Founded</td>
                        <td className="py-1.5 align-top">May 2026</td>
                      </tr>
                      <tr className="border-b border-[#eaecf0]">
                        <td className="font-bold py-1.5 pr-2 align-top text-[#54595d]">Founder</td>
                        <td className="py-1.5 align-top">
                          <button onClick={() => setActiveArticle('manjishtha')} className="text-[#0645ad] hover:underline cursor-pointer text-left">Manjishtha Pahilajani</button>
                        </td>
                      </tr>
                      <tr className="border-b border-[#eaecf0]">
                        <td className="font-bold py-1.5 pr-2 align-top text-[#54595d]">Key software</td>
                        <td className="py-1.5 align-top">
                          Browser-sandboxed de-escalation engine, AES-256 Local Vault
                        </td>
                      </tr>
                      <tr className="border-b border-[#eaecf0]">
                        <td className="font-bold py-1.5 pr-2 align-top text-[#54595d]">Infrastructure</td>
                        <td className="py-1.5 align-top">Google AI Studio</td>
                      </tr>
                      <tr className="border-b border-[#eaecf0]">
                        <td className="font-bold py-1.5 pr-2 align-top text-[#54595d]">Goal</td>
                        <td className="py-1.5 align-top">
                          De-escalate distress and prompt user to step away (AI grounding)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="text-center pt-2 text-[10px] text-[#72777d]">
                    <Globe className="w-3 h-3 inline-block mr-1" />
                    <a href="https://ai.studio/build" className="text-[#0645ad] hover:underline">Official Startup Profile</a>
                  </div>
                </div>

              </div>
            </>
          )}

        </div>

      </div>

      {/* Photo Upload / Update Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-fade-in">
          <div className="bg-white border border-[#a2a9b1] rounded-lg shadow-2xl max-w-md w-full overflow-hidden text-sm text-[#202122] flex flex-col">
            <div className="bg-[#f8f9fa] border-b border-[#eaecf0] px-4 py-3 flex items-center justify-between">
              <span className="font-serif text-lg font-bold flex items-center gap-2"><Camera className="w-5 h-5 text-[#36c]" /> Update Wiki Photo</span>
              <button 
                onClick={() => setShowPhotoModal(false)}
                className="text-[#72777d] hover:text-black p-1 hover:bg-slate-100 rounded transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#72777d]">Option 1: Upload Your Photo</span>
                <p className="text-xs text-[#54595d] leading-relaxed">
                  Select the image you just sent in the chat! It will convert directly into a high-quality local data link, saving it persistently in your browser.
                </p>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#a2a9b1] hover:border-[#36c] hover:bg-slate-50/50 rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group"
                >
                  <Upload className="w-8 h-8 text-[#72777d] group-hover:text-[#36c] transition-colors" />
                  <span className="font-bold text-xs text-[#0645ad] group-hover:underline">Choose image file</span>
                  <span className="text-[10px] text-[#72777d]">Supports PNG, JPG, JPEG, WEBP</span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#eaecf0]"></div>
                <span className="flex-shrink mx-4 text-[#72777d] text-xs font-bold uppercase">or</span>
                <div className="flex-grow border-t border-[#eaecf0]"></div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#72777d]">Option 2: Paste Image URL</span>
                <p className="text-xs text-[#54595d] leading-relaxed">
                  Have a direct link to your image? Paste the full URL below to load it instantly.
                </p>
                <form onSubmit={handleUrlSubmit} className="flex gap-2">
                  <input 
                    type="url" 
                    placeholder="https://images.unsplash.com/... or any photo link" 
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="flex-1 border border-[#a2a9b1] rounded px-3 py-1.5 text-xs focus:border-[#36c] focus:outline-none bg-[#f8f9fa] focus:bg-white transition-all"
                  />
                  <button 
                    type="submit"
                    className="bg-[#36c] hover:bg-[#4477dd] text-white font-semibold px-4 py-1.5 rounded text-xs transition-colors cursor-pointer"
                  >
                    Apply URL
                  </button>
                </form>
              </div>

              {photoUrl && (
                <div className="pt-4 border-t border-[#eaecf0] flex justify-between items-center">
                  <span className="text-xs text-[#54595d]">Currently displaying your custom photo</span>
                  <button 
                    onClick={handleResetPhoto}
                    className="text-[#d33] hover:underline text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Photo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

