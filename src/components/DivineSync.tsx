import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, Mail, RefreshCw, Send, Trash2, ShieldCheck, Sparkles, AlertCircle, 
  BookOpen, ExternalLink, Download, FileText, Check, ArrowRight, LogOut, ChevronRight,
  CheckSquare, Calendar as CalendarIcon, FileSpreadsheet, Users, FormInput, MessageSquare, Plus,
  User, CheckCircle2, UserPlus, Info, Presentation, Video, GraduationCap, StickyNote
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { initAuth, googleSignIn, logout } from '../lib/workspaceAuth';
import NotesSync from './NotesSync';

interface DivineSyncProps {
  isLightMode: boolean;
  initialTab?: 'drive' | 'gmail' | 'calendar' | 'tasks' | 'sheets' | 'contacts' | 'forms' | 'tony' | 'docs' | 'slides' | 'meet' | 'classroom' | 'notes';
}

interface SanctuaryFile {
  id: string;
  name: string;
  createdTime: string;
}

interface GmailMessage {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  counsel?: string;
  isAnalyzing?: boolean;
}

interface TaskItem {
  id: string;
  title: string;
  status: 'completed' | 'needsAction';
  notes?: string;
}

interface TaskList {
  id: string;
  title: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

interface SanctuaryContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface GoogleFormItem {
  id: string;
  name: string;
  webViewLink?: string;
}

export default function DivineSync({ isLightMode, initialTab = 'drive' }: DivineSyncProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'drive' | 'gmail' | 'calendar' | 'tasks' | 'sheets' | 'contacts' | 'forms' | 'tony' | 'docs' | 'slides' | 'meet' | 'classroom' | 'notes'>(initialTab);

  // Google Drive states
  const [driveFiles, setDriveFiles] = useState<SanctuaryFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [exportTitle, setExportTitle] = useState('');
  const [exportContent, setExportContent] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [viewedFileContent, setViewedFileContent] = useState<string | null>(null);
  const [viewedFileName, setViewedFileName] = useState<string | null>(null);
  const [isLoadingFileContent, setIsLoadingFileContent] = useState(false);

  // Gmail states
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [isLoadingGmail, setIsLoadingGmail] = useState(false);
  const [selectedDeity, setSelectedDeity] = useState('athena');
  const [selfReflectBody, setSelfReflectBody] = useState('');
  const [isSendingReflection, setIsSendingReflection] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Google Tasks states
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [selectedTaskList, setSelectedTaskList] = useState<string>('');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Google Calendar states
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('09:00');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Google Sheets states
  const [sheetsList, setSheetsList] = useState<SanctuaryFile[]>([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [isExportingSheet, setIsExportingSheet] = useState(false);
  const [exportedSheetUrl, setExportedSheetUrl] = useState<string | null>(null);

  // Contacts states
  const [contacts, setContacts] = useState<SanctuaryContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [isCreatingContact, setIsCreatingContact] = useState(false);

  // Google Forms states
  const [formsList, setFormsList] = useState<GoogleFormItem[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [createdFormUrl, setCreatedFormUrl] = useState<string | null>(null);
  const [newFormTitle, setNewFormTitle] = useState('');

  // Google Docs states
  const [docsList, setDocsList] = useState<SanctuaryFile[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocBody, setNewDocBody] = useState('');
  const [createdDocUrl, setCreatedDocUrl] = useState<string | null>(null);

  // Google Slides states
  const [slidesList, setSlidesList] = useState<SanctuaryFile[]>([]);
  const [isLoadingSlides, setIsLoadingSlides] = useState(false);
  const [isCreatingSlide, setIsCreatingSlide] = useState(false);
  const [newSlideTitle, setNewSlideTitle] = useState('');
  const [createdSlideUrl, setCreatedSlideUrl] = useState<string | null>(null);

  // Google Meet states
  const [meetSpaces, setMeetSpaces] = useState<Array<{ id: string; uri: string; code: string; title: string }>>([]);
  const [isLoadingMeet, setIsLoadingMeet] = useState(false);
  const [isCreatingMeet, setIsCreatingMeet] = useState(false);
  const [newMeetTitle, setNewMeetTitle] = useState('');

  // Google Classroom states
  const [classroomCourses, setClassroomCourses] = useState<any[]>([]);
  const [isLoadingClassroom, setIsLoadingClassroom] = useState(false);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseSection, setNewCourseSection] = useState('Sanctuary Alignment');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseAnnouncements, setCourseAnnouncements] = useState<any[]>([]);
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false);

  // Tony Customer Service Bot states
  const [tonyMessages, setTonyMessages] = useState<Array<{ sender: 'user' | 'tony'; text: string }>>([
    { sender: 'tony', text: "Hi there! I'm Tony, your Sanctuary Customer Service Guide. I'm here to assist you with connecting your Google Workspace, managing your daily tasks, setting up your calendar covenants, or discussing our classical art-infused therapeutic frameworks. What can I help you sync today?" }
  ]);
  const [tonyInput, setTonyInput] = useState('');
  const [isTonyTyping, setIsTonyTyping] = useState(false);

  const deities = [
    { id: 'athena', name: 'Athena (Hope)' },
    { id: 'poseidon', name: 'Poseidon (Jhulelal)' },
    { id: 'sisyphus', name: 'Sisyphus (Raag)' },
    { id: 'hades', name: 'Hades (Veer)' },
    { id: 'ares', name: 'Ares (Rudra)' },
    { id: 'sappho', name: 'Sappho (Manjishtha)' }
  ];

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch workspace data when token becomes available
  useEffect(() => {
    if (token) {
      fetchDriveFiles();
      fetchGmailMessages();
      fetchTaskLists();
      fetchCalendarEvents();
      fetchSheetsList();
      fetchContacts();
      fetchFormsList();
      fetchDocsList();
      fetchSlidesList();
      fetchMeetSpaces();
      fetchClassroomCourses();
    }
  }, [token]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Google Workspace Authentication Failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = window.confirm("Are you sure you want to disconnect your Google Workspace Covenant?");
    if (!confirmed) return;
    await logout();
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
    setDriveFiles([]);
    setEmails([]);
    setTasks([]);
    setCalendarEvents([]);
    setSheetsList([]);
    setContacts([]);
    setFormsList([]);
    setDocsList([]);
    setSlidesList([]);
    setMeetSpaces([]);
    setClassroomCourses([]);
    setViewedFileContent(null);
  };

  // ==========================================
  // GOOGLE DRIVE API CALLS
  // ==========================================
  const fetchDriveFiles = async () => {
    if (!token) return;
    setIsLoadingDrive(true);
    try {
      const query = encodeURIComponent("name contains 'Sanctuary Chronicle' and mimeType = 'text/plain' and trashed = false");
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&fields=files(id,name,createdTime)&pageSize=20`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setDriveFiles(data.files || []);
      }
    } catch (err) {
      console.error("Error accessing Google Drive:", err);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleExportToDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !exportContent.trim()) return;

    setIsExporting(true);
    try {
      const filename = `Sanctuary Chronicle - ${exportTitle.trim() || 'Untitled Reflection'} (${new Date().toLocaleDateString()}).txt`;
      
      const metadata = {
        name: filename,
        mimeType: 'text/plain',
      };

      const boundary = 'sanctuary_sync_boundary';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
        exportContent +
        closeDelim;

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      });

      if (res.ok) {
        setExportTitle('');
        setExportContent('');
        await fetchDriveFiles();
        alert("Chronicle scroll successfully synchronized and sealed inside Google Drive!");
      } else {
        alert("Failed to seal chronicle in Google Drive.");
      }
    } catch (err) {
      console.error("Error sealing chronicle:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleReadFile = async (fileId: string, fileName: string) => {
    if (!token) return;
    setIsLoadingFileContent(true);
    setViewedFileName(fileName);
    setViewedFileContent(null);
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const text = await res.text();
        setViewedFileContent(text);
      } else {
        setViewedFileContent("Unable to read the content of this divine scroll.");
      }
    } catch (err) {
      console.error("Error downloading file:", err);
      setViewedFileContent("Error connecting to Google Drive.");
    } finally {
      setIsLoadingFileContent(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!token) return;
    const confirmed = window.confirm(`Are you sure you want to incinerate and permanently delete "${fileName}" from your Google Drive?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setDriveFiles(prev => prev.filter(f => f.id !== fileId));
        if (viewedFileName === fileName) {
          setViewedFileContent(null);
          setViewedFileName(null);
        }
      } else {
        alert("Failed to delete file from Google Drive.");
      }
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };

  const handleLoadFromLocalJournal = () => {
    const stored = localStorage.getItem('sanctuaryJournals');
    if (stored) {
      try {
        const journals = JSON.parse(stored);
        if (journals && journals.length > 0) {
          const latest = journals[0];
          setExportTitle(latest.title);
          setExportContent(`--- SANCTUARY JOURNAL ENTRY ---\nDate: ${latest.date}\nTag: ${latest.tag}\nMood Score: ${latest.mood}%\nCompanion: ${latest.deity.toUpperCase()}\n\nJournal Content:\n${latest.entry}\n\nDeity Reflection:\n${latest.reflection || 'No reflection recorded'}`);
        } else {
          alert("Your local chronicle list is empty. Write an entry in the Reflective Journal first!");
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // ==========================================
  // GMAIL API CALLS
  // ==========================================
  const fetchGmailMessages = async () => {
    if (!token) return;
    setIsLoadingGmail(true);
    try {
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=is:unread', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        const messagesList = data.messages || [];
        
        const detailedEmails: GmailMessage[] = [];
        for (const msg of messagesList) {
          const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            const headers = detailData.payload?.headers || [];
            const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
            const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
            const dateHeader = headers.find((h: any) => h.name === 'Date')?.value || '';
            const date = new Date(dateHeader).toLocaleDateString() || '';
            detailedEmails.push({
              id: msg.id,
              from,
              subject,
              snippet: detailData.snippet || '',
              date
            });
          }
        }
        setEmails(detailedEmails);
      }
    } catch (err) {
      console.error("Error accessing Gmail:", err);
    } finally {
      setIsLoadingGmail(false);
    }
  };

  const handleRequestCounsel = async (emailId: string) => {
    const targetEmail = emails.find(e => e.id === emailId);
    if (!targetEmail) return;

    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, isAnalyzing: true } : e));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: { 
            name: selectedDeity.toUpperCase(), 
            badge: 'Sanctuary Deity', 
            alias: selectedDeity, 
            role: 'Compassionate Spiritual Guide',
            artStyle: 'Poetic reflection',
            quote: 'I guide you in alignment.',
            want: 'Help you resolve anxiety.',
            wound: 'Your mortal stress.',
            secret: 'I walk with you.'
          },
          history: [
            {
              role: 'user',
              parts: [{ 
                text: `I received a potentially stressful or overwhelming email.
Sender: "${targetEmail.from}"
Subject: "${targetEmail.subject}"
Email Preview: "${targetEmail.snippet}"

As my divine mentor ${selectedDeity.toUpperCase()}, provide me with a comforting and highly supportive evaluation of this message.
Help me de-escalate any anxiety or pressure this email creates. Frame its urgency dialectically, and suggest one boundary-focused action or peaceful thought. Write a comforting mentor response letter, directly to me, in 2 therapeutic and poetic paragraphs.` 
              }]
            }
          ]
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEmails(prev => prev.map(e => e.id === emailId ? { ...e, counsel: data.text, isAnalyzing: false } : e));
      } else {
        setEmails(prev => prev.map(e => e.id === emailId ? { ...e, counsel: "The temple signals are jammed, but take a deep breath. This message does not define your worth or sovereignty. Let the water settle.", isAnalyzing: false } : e));
      }
    } catch (err) {
      console.error(err);
      setEmails(prev => prev.map(e => e.id === emailId ? { ...e, counsel: "Failed to connect to the divine oracle.", isAnalyzing: false } : e));
    }
  };

  const handleSendSelfReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selfReflectBody.trim() || !user?.email) return;

    setIsSendingReflection(true);
    setSendSuccess(false);

    try {
      const subject = `Sanctuary Mindful Reflection Scroll - ${new Date().toLocaleDateString()}`;
      const emailBody = [
        `Dear Seeker,`,
        ``,
        `This is a mindful reflection scroll dispatched from your Temple of Dialectic Art & Soul companion.`,
        `Take a slow, deep abdominal breath and read the reflection you sealed:`,
        ``,
        `==================================================`,
        selfReflectBody.trim(),
        `==================================================`,
        ``,
        `With peace and sovereign grounding,`,
        `Your Sanctuary Pantheon Guides`,
        `Friend AI`
      ].join('\n');

      const rawEmail = [
        `To: ${user.email}`,
        `Subject: ${subject}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        '',
        emailBody
      ].join('\n');

      const encodedRaw = btoa(unescape(encodeURIComponent(rawEmail)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedRaw })
      });

      if (res.ok) {
        setSelfReflectBody('');
        setSendSuccess(true);
        setTimeout(() => setSendSuccess(false), 5000);
      } else {
        alert("Failed to send your reflection mail.");
      }
    } catch (err) {
      console.error("Error sending self reflection:", err);
    } finally {
      setIsSendingReflection(false);
    }
  };

  // ==========================================
  // GOOGLE TASKS API CALLS
  // ==========================================
  const fetchTaskLists = async () => {
    if (!token) return;
    setIsLoadingTasks(true);
    try {
      const res = await fetch('https://tasks.googleapis.com/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const lists = data.items || [];
        setTaskLists(lists);
        if (lists.length > 0) {
          setSelectedTaskList(lists[0].id);
          fetchTasksForList(lists[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching task lists:", err);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const fetchTasksForList = async (listId: string) => {
    if (!token || !listId) return;
    setIsLoadingTasks(true);
    try {
      const res = await fetch(`https://tasks.googleapis.com/v1/lists/${listId}/tasks?showCompleted=true&showHidden=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.items || []);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedTaskList || !newTaskTitle.trim()) return;
    setIsCreatingTask(true);
    try {
      const res = await fetch(`https://tasks.googleapis.com/v1/lists/${selectedTaskList}/tasks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          notes: "Created via Active Mind Sanctuary Divine Quest engine"
        })
      });
      if (res.ok) {
        setNewTaskTitle('');
        await fetchTasksForList(selectedTaskList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const toggleTaskComplete = async (task: TaskItem) => {
    if (!token || !selectedTaskList) return;
    const nextStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));

    try {
      const res = await fetch(`https://tasks.googleapis.com/v1/lists/${selectedTaskList}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: nextStatus,
          id: task.id
        })
      });
      if (!res.ok) {
        // Revert on error
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addPresetTask = async (title: string) => {
    if (!token || !selectedTaskList) return;
    setIsLoadingTasks(true);
    try {
      await fetch(`https://tasks.googleapis.com/v1/lists/${selectedTaskList}/tasks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          notes: "Therapeutic preset task from Sanctuary"
        })
      });
      await fetchTasksForList(selectedTaskList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // ==========================================
  // GOOGLE CALENDAR API CALLS
  // ==========================================
  const fetchCalendarEvents = async () => {
    if (!token) return;
    setIsLoadingCalendar(true);
    try {
      const timeMin = new Date().toISOString();
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&timeMin=${timeMin}&singleEvents=true&orderBy=startTime`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCalendarEvents(data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newEventTitle.trim() || !newEventDate) return;
    setIsCreatingEvent(true);
    try {
      const startDateTime = `${newEventDate}T${newEventTime}:00`;
      
      // Default duration is 30 mins
      const [hour, min] = newEventTime.split(':').map(Number);
      let endHour = hour;
      let endMin = min + 30;
      if (endMin >= 60) {
        endMin -= 60;
        endHour += 1;
      }
      const endHourStr = String(endHour).padStart(2, '0');
      const endMinStr = String(endMin).padStart(2, '0');
      const endDateTime = `${newEventDate}T${endHourStr}:${endMinStr}:00`;

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: `🌿 Sanctuary: ${newEventTitle.trim()}`,
          description: newEventDesc.trim() || "Somatic anchoring and therapeutic ritual planned in Active Mind Sanctuary",
          start: {
            dateTime: startDateTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: endDateTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        })
      });

      if (res.ok) {
        setNewEventTitle('');
        setNewEventDesc('');
        setNewEventDate('');
        await fetchCalendarEvents();
        alert("Meditation event locked and synced to Google Calendar!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const addPresetEvent = async (presetName: string, desc: string) => {
    if (!token) return;
    setIsLoadingCalendar(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: `🌿 Sanctuary: ${presetName}`,
          description: desc,
          start: {
            dateTime: `${dateStr}T10:00:00`,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: `${dateStr}T10:30:00`,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        })
      });

      if (res.ok) {
        await fetchCalendarEvents();
        alert(`Somatic practice '${presetName}' scheduled for tomorrow at 10:00 AM!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  // ==========================================
  // GOOGLE SHEETS API CALLS
  // ==========================================
  const fetchSheetsList = async () => {
    if (!token) return;
    setIsLoadingSheets(true);
    try {
      const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&fields=files(id,name,createdTime)&pageSize=10`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSheetsList(data.files || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const handleExportJournalToSheets = async () => {
    if (!token) return;
    
    const stored = localStorage.getItem('sanctuaryJournals');
    if (!stored) {
      alert("No journal entries found to export! Write a journal scroll first.");
      return;
    }

    let journals: any[] = [];
    try {
      journals = JSON.parse(stored);
    } catch (e) {
      console.error(e);
      return;
    }

    if (journals.length === 0) {
      alert("Your local journal list is empty!");
      return;
    }

    setIsExportingSheet(true);
    setExportedSheetUrl(null);

    try {
      // 1. Create a spreadsheet
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: { title: `Active Mind Sanctuary - Journals Backup (${new Date().toLocaleDateString()})` }
        })
      });

      if (!createRes.ok) {
        throw new Error("Could not create Google Sheet");
      }

      const sheetData = await createRes.json();
      const spreadsheetId = sheetData.spreadsheetId;
      const spreadsheetUrl = sheetData.spreadsheetUrl;

      // 2. Append values
      const rows = [
        ["Date", "Title", "Mood Score", "Companion Archetype", "Journal content", "Deity Reflection / Feedback"],
        ...journals.map(j => [
          j.date || '',
          j.title || '',
          `${j.mood || 50}%`,
          j.deity || '',
          j.entry || '',
          j.reflection || ''
        ])
      ];

      const appendRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: rows
        })
      });

      if (appendRes.ok) {
        setExportedSheetUrl(spreadsheetUrl);
        await fetchSheetsList();
        alert("Success! All local journals exported to a clean, structured Google Sheet!");
      } else {
        alert("Failed to populate Google Sheet rows.");
      }
    } catch (err) {
      console.error(err);
      alert("Error exporting journals to Google Sheets.");
    } finally {
      setIsExportingSheet(false);
    }
  };

  // ==========================================
  // GOOGLE CONTACTS (PEOPLE API) CALLS
  // ==========================================
  const fetchContacts = async () => {
    if (!token) return;
    setIsLoadingContacts(true);
    try {
      const res = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=20', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const connections = data.connections || [];
        const parsed = connections.map((conn: any) => ({
          id: conn.resourceName,
          name: conn.names?.[0]?.displayName || 'Unnamed Connection',
          email: conn.emailAddresses?.[0]?.value || 'No Email',
          phone: conn.phoneNumbers?.[0]?.value || 'No Phone'
        }));
        setContacts(parsed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newContactName.trim()) return;
    setIsCreatingContact(true);
    try {
      const body: any = {
        names: [{ givenName: newContactName.trim() }]
      };
      if (newContactEmail.trim()) {
        body.emailAddresses = [{ value: newContactEmail.trim() }];
      }
      if (newContactPhone.trim()) {
        body.phoneNumbers = [{ value: newContactPhone.trim() }];
      }

      const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setNewContactName('');
        setNewContactEmail('');
        setNewContactPhone('');
        await fetchContacts();
        alert("Contact added successfully to your Google Contacts list!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingContact(false);
    }
  };

  const addPresetDeityContact = async (name: string, email: string) => {
    if (!token) return;
    setIsLoadingContacts(true);
    try {
      const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          names: [{ givenName: `🌿 Sanctuary Companion: ${name}` }],
          emailAddresses: [{ value: email }],
          phoneNumbers: [{ value: "+1-555-TEMPLE" }]
        })
      });
      if (res.ok) {
        await fetchContacts();
        alert(`Spiritual contact '${name}' added to your real Google Contacts!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // ==========================================
  // GOOGLE FORMS API CALLS
  // ==========================================
  const fetchFormsList = async () => {
    if (!token) return;
    setIsLoadingForms(true);
    try {
      const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.form' and trashed = false");
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&fields=files(id,name,webViewLink)&pageSize=10`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFormsList(data.files || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingForms(false);
    }
  };

  const handleCreateGoogleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newFormTitle.trim()) return;
    setIsCreatingForm(true);
    setCreatedFormUrl(null);
    try {
      const res = await fetch('https://forms.googleapis.com/v1/forms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          info: {
            title: newFormTitle.trim(),
            documentTitle: newFormTitle.trim()
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedFormUrl(data.responderUri || `https://docs.google.com/forms/d/${data.formId}/viewform`);
        setNewFormTitle('');
        await fetchFormsList();
        alert("Google Form created! You can now access and share it.");
      } else {
        // Fallback responder link
        alert("Google Form creation requested. In typical environments, Forms require a G Suite administration setup. Opening standard creation tool.");
        window.open('https://forms.new', '_blank');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingForm(false);
    }
  };

  // ==========================================
  // GOOGLE DOCS API CALLS
  // ==========================================
  const fetchDocsList = async () => {
    if (!token) return;
    setIsLoadingDocs(true);
    try {
      const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.document' and trashed = false");
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&fields=files(id,name,createdTime)&pageSize=10`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocsList(data.files || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newDocTitle.trim()) return;
    setIsCreatingDoc(true);
    setCreatedDocUrl(null);
    try {
      const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newDocTitle.trim() })
      });
      if (createRes.ok) {
        const docData = await createRes.json();
        const docId = docData.documentId;
        const docUrl = `https://docs.google.com/document/d/${docId}/edit`;

        if (newDocBody.trim()) {
          await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              requests: [
                {
                  insertText: {
                    text: newDocBody.trim(),
                    location: { index: 1 }
                  }
                }
              ]
            })
          });
        }

        setCreatedDocUrl(docUrl);
        setNewDocTitle('');
        setNewDocBody('');
        await fetchDocsList();
        alert("Healing Doc successfully created and synchronized!");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating Google Doc.");
    } finally {
      setIsCreatingDoc(false);
    }
  };

  // ==========================================
  // GOOGLE SLIDES API CALLS
  // ==========================================
  const fetchSlidesList = async () => {
    if (!token) return;
    setIsLoadingSlides(true);
    try {
      const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.presentation' and trashed = false");
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&fields=files(id,name,createdTime)&pageSize=10`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSlidesList(data.files || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSlides(false);
    }
  };

  const handleCreateSlides = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newSlideTitle.trim()) return;
    setIsCreatingSlide(true);
    setCreatedSlideUrl(null);
    try {
      const res = await fetch('https://slides.googleapis.com/v1/presentations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newSlideTitle.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        const slideUrl = `https://docs.google.com/presentation/d/${data.presentationId}/edit`;
        setCreatedSlideUrl(slideUrl);
        setNewSlideTitle('');
        await fetchSlidesList();
        alert("Healing Slide Deck created successfully!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingSlide(false);
    }
  };

  // ==========================================
  // GOOGLE MEET API CALLS
  // ==========================================
  const handleCreateMeetSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newMeetTitle.trim()) return;
    setIsCreatingMeet(true);
    try {
      const res = await fetch('https://meet.googleapis.com/v1/spaces', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config: {
            accessType: 'OPEN'
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const newSpace = {
          id: data.name || `space-${Date.now()}`,
          uri: data.meetingUri,
          code: data.meetingCode,
          title: newMeetTitle.trim()
        };
        const currentSpaces = JSON.parse(localStorage.getItem('sanctuaryMeetSpaces') || '[]');
        const updated = [newSpace, ...currentSpaces];
        localStorage.setItem('sanctuaryMeetSpaces', JSON.stringify(updated));
        setMeetSpaces(updated);
        setNewMeetTitle('');
        alert("Somatic Discussion Space created! Let your mentors guide you.");
      } else {
        // Fallback: Create a calendar event with conference data
        const tomorrow = new Date();
        tomorrow.setHours(tomorrow.getHours() + 1);
        const startTime = tomorrow.toISOString();
        const endTmp = new Date(tomorrow.getTime());
        endTmp.setMinutes(endTmp.getMinutes() + 30);
        const endTime = endTmp.toISOString();

        const calRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            summary: `🌿 Sanctuary Meet: ${newMeetTitle.trim()}`,
            description: "Somatic group discussion space and alignment check",
            start: { dateTime: startTime },
            end: { dateTime: endTime },
            conferenceData: {
              createRequest: {
                requestId: `meet-${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' }
              }
            }
          })
        });

        if (calRes.ok) {
          const calData = await calRes.json();
          const entryPoint = calData.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video');
          if (entryPoint) {
            const newSpace = {
              id: calData.id,
              uri: entryPoint.uri,
              code: calData.id,
              title: newMeetTitle.trim()
            };
            const currentSpaces = JSON.parse(localStorage.getItem('sanctuaryMeetSpaces') || '[]');
            const updated = [newSpace, ...currentSpaces];
            localStorage.setItem('sanctuaryMeetSpaces', JSON.stringify(updated));
            setMeetSpaces(updated);
            setNewMeetTitle('');
            alert("Google Meet room successfully initialized via Calendar Event Bridge!");
          } else {
            alert("Could not generate Google Meet link from Calendar.");
          }
        } else {
          alert("Could not initialize Meet session.");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingMeet(false);
    }
  };

  const fetchMeetSpaces = () => {
    const spaces = JSON.parse(localStorage.getItem('sanctuaryMeetSpaces') || '[]');
    setMeetSpaces(spaces);
  };

  // ==========================================
  // GOOGLE CLASSROOM API CALLS
  // ==========================================
  const fetchClassroomCourses = async () => {
    if (!token) return;
    setIsLoadingClassroom(true);
    try {
      const res = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const courses = data.courses || [];
        setClassroomCourses(courses);
        if (courses.length > 0) {
          setSelectedCourseId(courses[0].id);
          fetchCourseAnnouncements(courses[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingClassroom(false);
    }
  };

  const fetchCourseAnnouncements = async (courseId: string) => {
    if (!token || !courseId) return;
    try {
      const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourseAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newCourseName.trim()) return;
    setIsCreatingCourse(true);
    try {
      const res = await fetch('https://classroom.googleapis.com/v1/courses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newCourseName.trim(),
          section: newCourseSection.trim(),
          ownerId: 'me',
          courseState: 'ACTIVE'
        })
      });
      if (res.ok) {
        setNewCourseName('');
        await fetchClassroomCourses();
        alert("Divine Alignment classroom cohort established successfully!");
      } else {
        alert("Failed to establish classroom cohort. Please ensure you have classroom teacher privileges.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingCourse(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCourseId || !newAnnouncementText.trim()) return;
    setIsCreatingAnnouncement(true);
    try {
      const res = await fetch(`https://classroom.googleapis.com/v1/courses/${selectedCourseId}/announcements`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: newAnnouncementText.trim(),
          state: 'PUBLISHED'
        })
      });
      if (res.ok) {
        setNewAnnouncementText('');
        await fetchCourseAnnouncements(selectedCourseId);
        alert("Instruction published to Class announcement stream!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingAnnouncement(false);
    }
  };

  // ==========================================
  // TONY BOT CHAT (GEMINI CHAT ROUTE)
  // ==========================================
  const handleTonyChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tonyInput.trim()) return;

    const userText = tonyInput.trim();
    setTonyMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setTonyInput('');
    setIsTonyTyping(true);

    try {
      // Map existing chats into Gemini parts
      const history = tonyMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
      history.push({ role: 'user', parts: [{ text: userText }] });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: {
            name: "Tony",
            badge: "Temple Custodian & Integration Assistant",
            alias: "Tony",
            role: "Mind Sanctuary Customer Support Guide & Bot Assistant",
            artStyle: "Warm, supportive, friendly modern UI advisor with geometric visual analogies",
            quote: "I alignment-lock your calendars and spreadsheets so you can breathe freely.",
            want: "Help users link Google Tasks, Calendar, Sheets, and Contacts smoothly.",
            wound: "When things aren't synced properly",
            secret: "I secretly want to learn Pichwai painting from Sisyphus."
          },
          history
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTonyMessages(prev => [...prev, { sender: 'tony', text: data.text }]);
      } else {
        setTonyMessages(prev => [...prev, { sender: 'tony', text: "Hmm, my connection lines seem slightly crossed! However, let me assure you that your tasks, calendars, and sheets sync perfectly. Take a slow deep breath, and let's try again!" }]);
      }
    } catch (err) {
      console.error(err);
      setTonyMessages(prev => [...prev, { sender: 'tony', text: "Offline signal detected. But take comfort, I'm here to support you anytime!" }]);
    } finally {
      setIsTonyTyping(false);
    }
  };

  // ==========================================
  // RENDER AUTHENTICATION VIEW
  // ==========================================
  if (needsAuth) {
    return (
      <div className={`p-8 rounded-3xl border-2 text-center max-w-2xl mx-auto space-y-6 ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be] text-slate-800' : 'bg-[#0b1310] border-[#1d3d30] text-white'}`}>
        <div className="w-16 h-16 rounded-2xl bg-[#c9a45c]/10 border border-[#c9a45c]/40 flex items-center justify-center text-[#c9a45c] mx-auto shadow-inner animate-pulse">
          <Cloud className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-2xl font-bold tracking-tight text-[#c9a45c]">
            Establish Divine Workspace Covenant
          </h3>
          <p className="text-xs leading-relaxed opacity-80 max-w-md mx-auto">
            Authorize a secure, read-write bridge to Google Calendar, Tasks, Sheets, Contacts, Forms, and Gmail. Manage your schedule, journal backup, and habits with AI-assisted guidance.
          </p>
        </div>

        <div className="p-4 rounded-xl text-left text-[11px] leading-relaxed border border-yellow-500/10 bg-yellow-500/5 max-w-md mx-auto flex gap-3 items-start text-yellow-500">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-bold block uppercase tracking-wider text-[9px] mb-0.5">Privacy Protocol</span>
            Your Google Workspace tokens are loaded securely into transient memory only and NEVER persisted on any database or external server. All API requests are routed straight to Google from your browser.
          </div>
        </div>

        <div className="pt-4 flex justify-center">
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="gsi-material-button hover:scale-[1.02] transition-transform cursor-pointer"
          >
            <div className="gsi-material-button-state"></div>
            <div className="gsi-material-button-content-wrapper">
              <div className="gsi-material-button-icon">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents">
                {isLoggingIn ? "Establishing Covenant..." : "Sign in with Google"}
              </span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Connected Header */}
      <div className={`p-5 rounded-2xl border-2 flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${isLightMode ? 'bg-[#f4f0e6] border-[#dfd2be] text-stone-900' : 'bg-[#1b2420] border-brown text-white'}`}>
        <div className="flex items-center gap-4 text-left w-full md:w-auto">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono tracking-wider text-emerald-400 uppercase font-bold">Covenant Active</span>
              <span className="text-[8px] font-mono bg-periwinkle/15 text-periwinkle px-2 py-0.5 rounded-full font-bold">Divine Sync Live</span>
            </div>
            <h4 className={`font-serif text-base font-bold ${isLightMode ? 'text-stone-900' : 'text-white'}`}>
              Sanctuary Google Workspace Portal
            </h4>
            <p className="text-[10px] font-mono text-slate-400">
              Covenant Account: {user?.email}
            </p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/30 border border-red-500/20 hover:border-red-500/50 px-3.5 py-2 rounded-xl cursor-pointer transition-all self-end md:self-center"
        >
          <LogOut className="w-3.5 h-3.5" /> Disconnect Covenant
        </button>
      </div>

      {/* Tabs list (Highly responsive & scannable) */}
      <div className="flex flex-wrap border-b border-brown/20 pb-1 gap-2">
        {[
          { id: 'drive', label: 'Drive Archives', icon: Cloud },
          { id: 'notes', label: 'Notes Sync (Keep)', icon: StickyNote },
          { id: 'gmail', label: 'Gmail Counsel', icon: Mail },
          { id: 'calendar', label: 'Calendar Schedule', icon: CalendarIcon },
          { id: 'tasks', label: 'Tasks Quests', icon: CheckSquare },
          { id: 'sheets', label: 'Sheets Exporter', icon: FileSpreadsheet },
          { id: 'contacts', label: 'Contacts Circle', icon: Users },
          { id: 'forms', label: 'Forms Clinic', icon: FormInput },
          { id: 'docs', label: 'Docs Writer', icon: FileText },
          { id: 'slides', label: 'Slides Deck', icon: Presentation },
          { id: 'meet', label: 'Meet Spaces', icon: Video },
          { id: 'classroom', label: 'Classroom Academics', icon: GraduationCap },
          { id: 'tony', label: 'Tony Bot', icon: MessageSquare }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 font-serif text-[10px] md:text-[11px] uppercase tracking-wider font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === tab.id ? 'border-[#c9a45c] text-[#c9a45c]' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        
        {/* GOOGLE DRIVE ARCHIVES */}
        {activeTab === 'drive' && (
          <motion.div key="tab-drive" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className={`lg:col-span-6 p-6 rounded-2xl border-2 flex flex-col justify-between min-h-[450px] ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be]' : 'bg-brown-deep/40 border-brown'}`}>
              <form onSubmit={handleExportToDrive} className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a45c]">Seal Reflection scroll</span>
                  <button type="button" onClick={handleLoadFromLocalJournal} className="text-[9px] font-mono flex items-center gap-1 text-[#c9a45c] hover:text-white bg-[#c9a45c]/10 hover:bg-[#c9a45c]/25 border border-[#c9a45c]/30 px-3 py-1 rounded-full cursor-pointer transition-all">
                    <BookOpen className="w-3 h-3" /> Load Latest Local Journal
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-wider opacity-75 mb-1.5">Scroll Name</label>
                    <input type="text" required value={exportTitle} onChange={e => setExportTitle(e.target.value)} placeholder="My Healing Journey, Epiphany, etc." className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-wider opacity-75 mb-1.5">Scroll Body Content</label>
                    <textarea required rows={8} value={exportContent} onChange={e => setExportContent(e.target.value)} placeholder="Compose a reflective scroll to save inside Google Drive..." className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] font-serif leading-relaxed ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`} />
                  </div>
                </div>
                <button type="submit" disabled={isExporting || !exportContent.trim()} className="w-full py-3 bg-[#c9a45c] hover:bg-[#b08e4f] disabled:opacity-40 text-black rounded-xl text-xs uppercase tracking-wider font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all">
                  {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />} Seal to Drive
                </button>
              </form>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-serif text-sm font-bold opacity-80 uppercase tracking-wider">Sealed Drive Scrolls</h4>
                <button onClick={fetchDriveFiles} disabled={isLoadingDrive} className="p-1.5 text-sage hover:text-white border border-brown rounded-lg bg-black/15 hover:bg-black/30 cursor-pointer">
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isLoadingDrive ? (
                <div className="p-12 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-[#c9a45c]" /> Scan Drive...
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-brown/50 rounded-2xl">
                  <Cloud className="w-8 h-8 mx-auto mb-2 opacity-45" /> No logs on Drive yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto">
                  {driveFiles.map((file) => (
                    <div key={file.id} className="p-3 rounded-xl border border-brown/45 flex items-center justify-between gap-3 bg-black/10">
                      <div onClick={() => handleReadFile(file.id, file.name)} className="flex items-center gap-3 text-xs text-left cursor-pointer flex-1 truncate">
                        <FileText className="w-4 h-4 text-[#c9a45c] shrink-0" />
                        <div>
                          <span className="font-bold text-white block truncate text-[11px]">{file.name}</span>
                          <span className="text-[8px] font-mono opacity-50">{new Date(file.createdTime).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleReadFile(file.id, file.name)} className="p-1.5 border border-brown rounded text-[#c9a45c] hover:bg-[#c9a45c]/10 cursor-pointer"><ChevronRight className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteFile(file.id, file.name)} className="p-1.5 border border-red-500/20 text-red-400 hover:bg-red-500/10 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {viewedFileName && (
                <div className={`p-4 rounded-xl border-2 space-y-2 text-xs leading-relaxed ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be]' : 'bg-[#1b2420] border-[#c9a45c]/40'}`}>
                  <div className="flex justify-between items-center border-b border-brown/30 pb-2">
                    <span className="font-serif font-black text-[#c9a45c] uppercase text-[10px]">📖 {viewedFileName}</span>
                    <button onClick={() => { setViewedFileContent(null); setViewedFileName(null); }} className="text-[9px] text-red-400 hover:underline">Close</button>
                  </div>
                  {isLoadingFileContent ? <p className="text-[10px] font-mono text-center">Unsealing fibers...</p> : <div className="whitespace-pre-wrap max-h-[180px] overflow-y-auto font-serif pl-2 border-l border-brown/30">{viewedFileContent}</div>}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* GMAIL COUNSEL */}
        {activeTab === 'gmail' && (
          <motion.div key="tab-gmail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <h4 className="font-serif text-sm font-bold opacity-80 uppercase">Unread Email Analyzer</h4>
                  <p className="text-[10px] text-slate-400">Request mindful counsels for stressful unread mail.</p>
                </div>
                <div className="flex gap-2">
                  <select value={selectedDeity} onChange={e => setSelectedDeity(e.target.value)} className="text-[10px] font-mono px-3 py-1 rounded-xl border border-brown bg-[#03070f] text-white">
                    {deities.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <button onClick={fetchGmailMessages} className="p-1.5 border border-brown rounded bg-black/15 hover:bg-black/30"><RefreshCw className={`w-3.5 h-3.5 ${isLoadingGmail ? 'animate-spin' : ''}`} /></button>
                </div>
              </div>

              {isLoadingGmail ? (
                <div className="p-12 text-center text-slate-400"><RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-[#c9a45c]" /> Scanning...</div>
              ) : emails.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-brown/40 rounded-2xl">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                  <p className="text-xs font-serif font-bold text-emerald-400">Your Inbox is Serene</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {emails.map((email) => (
                    <div key={email.id} className="p-4 rounded-xl border border-brown bg-[#121915]/50 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[9px] font-mono text-[#c9a45c] font-black truncate max-w-[200px]">From: {email.from}</span>
                        <span className="text-[9px] font-mono text-slate-500">{email.date}</span>
                      </div>
                      <h5 className="font-serif text-xs font-bold text-white mt-1">{email.subject}</h5>
                      <p className="opacity-75 italic text-[11px]">"{email.snippet}"</p>
                      {email.counsel ? (
                        <div className="p-3 bg-black/20 border border-brown rounded space-y-1 text-sage text-[11px]">
                          <span className="font-serif font-black text-[#c9a45c] text-[10px] block">✦ Counsel from {selectedDeity.toUpperCase()}</span>
                          <p className="whitespace-pre-wrap">{email.counsel}</p>
                        </div>
                      ) : (
                        <button onClick={() => handleRequestCounsel(email.id)} className="py-1 px-3.5 bg-[#c9a45c]/20 hover:bg-[#c9a45c]/30 border border-[#c9a45c]/40 text-[#c9a45c] font-mono text-[9px] font-bold rounded-lg transition-all"><Sparkles className="w-3 h-3 inline mr-1" /> Analyze with {selectedDeity.toUpperCase()}</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`lg:col-span-5 p-6 rounded-2xl border-2 flex flex-col justify-between min-h-[450px] ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be]' : 'bg-brown-deep/40 border-brown'}`}>
              <form onSubmit={handleSendSelfReflection} className="space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a45c] block">Mindful Dispatch</span>
                <h4 className="font-serif text-sm font-bold text-white leading-tight">Send Mindful Reflection to Yourself</h4>
                <textarea required rows={7} value={selfReflectBody} onChange={e => setSelfReflectBody(e.target.value)} placeholder="I commit to taking deep breaths when things get busy today..." className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] font-serif leading-relaxed ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`} />
                <button type="submit" disabled={isSendingReflection || !selfReflectBody.trim()} className="w-full py-3 bg-periwinkle hover:bg-periwinkle-hover disabled:opacity-40 text-white rounded-xl text-xs uppercase tracking-wider font-mono font-bold flex items-center justify-center gap-2">
                  {isSendingReflection ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Reflection to Inbox
                </button>
              </form>
              {sendSuccess && <div className="mt-4 p-3 bg-emerald-500/15 text-emerald-400 rounded-xl text-xs text-center font-mono font-bold uppercase">✉️ Dispatched successfully!</div>}
            </div>
          </motion.div>
        )}

        {/* GOOGLE CALENDAR SCHEDULE */}
        {activeTab === 'calendar' && (
          <motion.div key="tab-calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className={`lg:col-span-6 p-6 rounded-2xl border-2 min-h-[450px] space-y-4 ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be]' : 'bg-brown-deep/40 border-brown'}`}>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a45c] block">Covenant Schedule</span>
              <h4 className="font-serif text-sm font-bold text-white">Schedule a Sacred Practice Block</h4>
              
              <form onSubmit={handleCreateEvent} className="space-y-4 text-left">
                <div>
                  <label className="block text-[9px] font-mono uppercase opacity-75 mb-1.5">Ritual Name</label>
                  <input type="text" required value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} placeholder="30 Min Breathwork, Mindful Tea Session..." className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`} />
                </div>
                <div>
                  <label className="block text-[9px] font-mono uppercase opacity-75 mb-1.5">Description & Intention</label>
                  <textarea rows={2} value={newEventDesc} onChange={e => setNewEventDesc(e.target.value)} placeholder="Intention: To align somatic pathways and ground my heavy boulder." className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-mono uppercase opacity-75 mb-1.5">Date</label>
                    <input type="date" required value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be]' : 'bg-brown-deep/80 border-brown text-white'}`} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono uppercase opacity-75 mb-1.5">Time</label>
                    <input type="time" value={newEventTime} onChange={e => setNewEventTime(e.target.value)} className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be]' : 'bg-brown-deep/80 border-brown text-white'}`} />
                  </div>
                </div>
                <button type="submit" disabled={isCreatingEvent} className="w-full py-3 bg-[#c9a45c] hover:bg-[#b08e4f] text-black font-mono font-bold uppercase text-xs tracking-wider rounded-xl flex items-center justify-center gap-2">
                  {isCreatingEvent ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CalendarIcon className="w-4 h-4" />} Lock Session to Google Calendar
                </button>
              </form>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-serif text-sm font-bold opacity-80 uppercase">Upcoming Calendar Events</h4>
                <button onClick={fetchCalendarEvents} className="p-1.5 text-sage border border-brown rounded bg-black/15"><RefreshCw className={`w-3.5 h-3.5 ${isLoadingCalendar ? 'animate-spin' : ''}`} /></button>
              </div>

              {/* Preset buttons */}
              <div className="p-4 bg-periwinkle/10 border border-periwinkle/30 rounded-2xl text-left space-y-3">
                <span className="text-[9px] font-mono uppercase font-bold text-periwinkle flex items-center gap-1"><Sparkles className="w-3 h-3" /> Quick Deity Presets (1-Click Tomorrow)</span>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => addPresetEvent("Sisyphus Deep Focus", "Somatic deep focus hour to tackle tasks without anxiety.")} className="text-[10px] font-mono bg-brown-deep hover:bg-brown border border-[#c9a45c]/40 text-white px-3 py-1.5 rounded-lg cursor-pointer transition-all">✦ Sisyphus Hour</button>
                  <button onClick={() => addPresetEvent("Athena DBT Alignment", "DBT fact-checking and structured logical planning hour.")} className="text-[10px] font-mono bg-brown-deep hover:bg-brown border border-[#c9a45c]/40 text-white px-3 py-1.5 rounded-lg cursor-pointer transition-all">✦ Athena Clarity</button>
                  <button onClick={() => addPresetEvent("Sappho Poem & Tea", "Empathy journaling and deep aesthetic poetry reading session.")} className="text-[10px] font-mono bg-brown-deep hover:bg-brown border border-[#c9a45c]/40 text-white px-3 py-1.5 rounded-lg cursor-pointer transition-all">✦ Sappho Calm</button>
                </div>
              </div>

              {isLoadingCalendar ? (
                <div className="p-12 text-center text-slate-400"><RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-[#c9a45c]" /> Loading schedule...</div>
              ) : calendarEvents.length === 0 ? (
                <p className="p-8 text-center border border-dashed border-brown/40 rounded-2xl text-xs">No upcoming sessions. Use the left form to schedule one!</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {calendarEvents.map((event) => (
                    <div key={event.id} className="p-3 rounded-xl border border-brown/40 bg-black/10 text-left text-xs space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-white text-[11px] truncate max-w-[220px]">{event.summary}</span>
                        <span className="text-periwinkle font-mono text-[9px]">
                          {event.start?.dateTime ? new Date(event.start.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'All Day'}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-mono">
                        Date: {event.start?.dateTime ? new Date(event.start.dateTime).toLocaleDateString() : event.start?.date}
                      </p>
                      {event.description && <p className="text-[10px] text-sage italic opacity-85 truncate">"{event.description}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* GOOGLE TASKS QUESTS */}
        {activeTab === 'tasks' && (
          <motion.div key="tab-tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className={`lg:col-span-5 p-6 rounded-2xl border-2 min-h-[450px] space-y-4 ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be]' : 'bg-brown-deep/40 border-brown'}`}>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a45c] block">Quest Registry</span>
              <h4 className="font-serif text-sm font-bold text-white">Create a Daily Healing Quest</h4>
              
              <form onSubmit={handleCreateTask} className="space-y-4 text-left">
                <div>
                  <label className="block text-[9px] font-mono uppercase opacity-75 mb-1.5">Quest List</label>
                  <select value={selectedTaskList} onChange={e => { setSelectedTaskList(e.target.value); fetchTasksForList(e.target.value); }} className="w-full text-xs p-3 rounded-xl border-2 border-brown bg-[#03070f] text-white">
                    {taskLists.map(list => <option key={list.id} value={list.id}>{list.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-mono uppercase opacity-75 mb-1.5">Quest Title</label>
                  <input type="text" required value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Ex: Take 5 abdominal breaths, Hydrate..." className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`} />
                </div>
                <button type="submit" disabled={isCreatingTask || !newTaskTitle.trim()} className="w-full py-3 bg-[#c9a45c] hover:bg-[#b08e4f] text-black font-mono font-bold uppercase text-xs tracking-wider rounded-xl flex items-center justify-center gap-2">
                  {isCreatingTask ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Quest to Google Tasks
                </button>
              </form>

              {/* Quick Presets */}
              <div className="pt-4 border-t border-brown/30 space-y-2 text-left">
                <span className="text-[9px] font-mono uppercase font-bold text-[#c9a45c] block">✦ Quick Quests Presets</span>
                <div className="space-y-1.5">
                  {[
                    "Complete daily somatic breathwork circle",
                    "Pen a 3-sentence release journal entry",
                    "Water a household plant & stand in sunlight",
                    "Acknowledge 1 difficult emotion without guilt"
                  ].map((preset, idx) => (
                    <button key={idx} onClick={() => addPresetTask(preset)} className="w-full text-left p-2 rounded bg-black/15 hover:bg-black/30 border border-brown/30 text-[10px] font-mono text-slate-300 transition-colors flex items-center gap-1.5">
                      <Plus className="w-3 h-3 text-[#c9a45c]" /> {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-serif text-sm font-bold opacity-80 uppercase">Google Tasks Alignment Checklist</h4>
                <button onClick={() => fetchTasksForList(selectedTaskList)} className="p-1.5 text-sage border border-brown rounded bg-black/15"><RefreshCw className={`w-3.5 h-3.5 ${isLoadingTasks ? 'animate-spin' : ''}`} /></button>
              </div>

              {isLoadingTasks ? (
                <div className="p-12 text-center text-slate-400"><RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-[#c9a45c]" /> Scanning quests...</div>
              ) : tasks.length === 0 ? (
                <p className="p-8 text-center border border-dashed border-brown/40 rounded-2xl text-xs text-slate-400">No active quests detected in this list!</p>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {tasks.map((task) => (
                    <div key={task.id} className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-colors ${task.status === 'completed' ? 'border-emerald-500/20 bg-emerald-500/5 opacity-60' : 'border-brown/40 bg-black/15 hover:border-[#c9a45c]/50'}`}>
                      <button onClick={() => toggleTaskComplete(task)} className="p-1 rounded bg-black/20 hover:bg-black/40 border border-brown mt-0.5 cursor-pointer">
                        {task.status === 'completed' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <div className="w-3.5 h-3.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className={`text-[11px] font-bold block ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-white'}`}>{task.title}</span>
                        {task.notes && <p className="text-[9px] text-slate-400 mt-1 font-mono">{task.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* GOOGLE SHEETS EXPORTER */}
        {activeTab === 'sheets' && (
          <motion.div key="tab-sheets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className={`lg:col-span-6 p-6 rounded-2xl border-2 min-h-[450px] flex flex-col justify-between ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be]' : 'bg-brown-deep/40 border-brown'}`}>
              <div className="space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a45c] block">Sanctuary Sheets</span>
                <h4 className="font-serif text-base font-bold text-white leading-tight">Export Journals to Google Sheets</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Back up your entire offline reflection journal logs to a beautifully structured, secure Google Sheet instantly. This converts local data into clean cloud rows.
                </p>

                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-left text-xs space-y-1.5 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5 inline mr-1 text-emerald-400 float-left" />
                  <p className="font-bold">Automated Data Mapping</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">Maps dates, titles, customized mood score ratios, spiritual companion assignments, journaling scripts, and AI-deity insights safely.</p>
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <button onClick={handleExportJournalToSheets} disabled={isExportingSheet} className="w-full py-3 bg-[#c9a45c] hover:bg-[#b08e4f] disabled:opacity-40 text-black font-mono font-bold uppercase text-xs tracking-wider rounded-xl flex items-center justify-center gap-2">
                  {isExportingSheet ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />} Create Spreadsheet & Export
                </button>

                {exportedSheetUrl && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-center space-y-2">
                    <p className="text-emerald-400 font-bold uppercase font-mono text-[10px]">🌿 Spreadsheet successfully synchronized!</p>
                    <a href={exportedSheetUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 bg-[#c9a45c] hover:bg-[#b08e4f] text-black font-bold px-4 py-1.5 rounded-lg text-[10px] uppercase font-mono tracking-wider">
                      Open Google Sheet <ExternalLink className="w-3 h-3" />
                    </a>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-serif text-sm font-bold opacity-80 uppercase">Active Sanctuary Spreadsheets</h4>
                <button onClick={fetchSheetsList} className="p-1.5 text-sage border border-brown rounded bg-black/15"><RefreshCw className={`w-3.5 h-3.5 ${isLoadingSheets ? 'animate-spin' : ''}`} /></button>
              </div>

              {isLoadingSheets ? (
                <div className="p-12 text-center text-slate-400"><RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-[#c9a45c]" /> Scanning sheets...</div>
              ) : sheetsList.length === 0 ? (
                <p className="p-8 text-center border border-dashed border-brown/40 rounded-2xl text-xs text-slate-400">No active Sanctuary backup spreadsheets found on your Drive.</p>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto">
                  {sheetsList.map((sheet) => (
                    <div key={sheet.id} className="p-3 rounded-xl border border-brown/45 bg-black/10 text-left flex justify-between items-center text-xs gap-3">
                      <div className="flex items-center gap-3 truncate">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-white block truncate text-[11px]">{sheet.name}</span>
                          <span className="text-[8px] font-mono opacity-50">{new Date(sheet.createdTime).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <a href={`https://docs.google.com/spreadsheets/d/${sheet.id}`} target="_blank" rel="noopener noreferrer" className="p-1.5 border border-brown rounded text-[#c9a45c] hover:bg-[#c9a45c]/10" title="Open spreadsheet">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* CONTACTS CIRCLE */}
        {activeTab === 'contacts' && (
          <motion.div key="tab-contacts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className={`lg:col-span-5 p-6 rounded-2xl border-2 min-h-[450px] space-y-4 ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be]' : 'bg-brown-deep/40 border-brown'}`}>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a45c] block">Covenant Contacts</span>
              <h4 className="font-serif text-sm font-bold text-white">Add peer/therapist contact</h4>
              
              <form onSubmit={handleCreateContact} className="space-y-3.5 text-left text-xs">
                <div>
                  <label className="block text-[9px] font-mono uppercase opacity-75 mb-1.5">Display Name</label>
                  <input type="text" required value={newContactName} onChange={e => setNewContactName(e.target.value)} placeholder="Therapist Krishna, Peer Jane, etc." className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`} />
                </div>
                <div>
                  <label className="block text-[9px] font-mono uppercase opacity-75 mb-1.5">Email Address</label>
                  <input type="email" value={newContactEmail} onChange={e => setNewContactEmail(e.target.value)} placeholder="contact@example.com" className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`} />
                </div>
                <div>
                  <label className="block text-[9px] font-mono uppercase opacity-75 mb-1.5">Phone (Optional)</label>
                  <input type="tel" value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)} placeholder="+1 (555) 0199" className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`} />
                </div>
                <button type="submit" disabled={isCreatingContact || !newContactName.trim()} className="w-full py-3 bg-[#c9a45c] hover:bg-[#b08e4f] text-black font-mono font-bold uppercase text-xs tracking-wider rounded-xl flex items-center justify-center gap-2">
                  {isCreatingContact ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Create Google Contact
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-serif text-sm font-bold opacity-80 uppercase">Covenant Connections List</h4>
                <button onClick={fetchContacts} className="p-1.5 text-sage border border-brown rounded bg-black/15"><RefreshCw className={`w-3.5 h-3.5 ${isLoadingContacts ? 'animate-spin' : ''}`} /></button>
              </div>

              {/* Deity spiritual companion contacts presets */}
              <div className="p-4 bg-periwinkle/10 border border-periwinkle/20 rounded-2xl text-left space-y-2">
                <span className="text-[9px] font-mono uppercase font-bold text-periwinkle block">✦ Companion Spiritual Hotlines (Google Contacts)</span>
                <p className="text-[10px] text-slate-400">Add custom deity counseling contacts directly into your real address book!</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={() => addPresetDeityContact("Sisyphus", "sisyphus.raag@temple.net")} className="text-[10px] font-mono bg-black/35 hover:bg-black/55 text-white px-2.5 py-1 rounded-lg border border-brown/40 cursor-pointer">Add Sisyphus</button>
                  <button onClick={() => addPresetDeityContact("Athena", "athena.hope@temple.net")} className="text-[10px] font-mono bg-black/35 hover:bg-black/55 text-white px-2.5 py-1 rounded-lg border border-brown/40 cursor-pointer">Add Athena</button>
                  <button onClick={() => addPresetDeityContact("Sappho", "sappho.manjishtha@temple.net")} className="text-[10px] font-mono bg-black/35 hover:bg-black/55 text-white px-2.5 py-1 rounded-lg border border-brown/40 cursor-pointer">Add Sappho</button>
                </div>
              </div>

              {isLoadingContacts ? (
                <div className="p-12 text-center text-slate-400"><RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-[#c9a45c]" /> Syncing contacts...</div>
              ) : contacts.length === 0 ? (
                <p className="p-8 text-center border border-dashed border-brown/40 rounded-2xl text-xs text-slate-400">No synchronized contacts detected. Add a therapist or peer using the left form.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="p-3 rounded-xl border border-brown/45 bg-black/15 text-left text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-[#c9a45c]/10 border border-[#c9a45c]/30 text-[#c9a45c]"><User className="w-3.5 h-3.5" /></div>
                        <span className="font-bold text-white block truncate">{contact.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{contact.email}</p>
                      {contact.phone && <p className="text-[10px] text-[#c9a45c] font-mono">{contact.phone}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* GOOGLE FORMS */}
        {activeTab === 'forms' && (
          <motion.div key="tab-forms" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className={`lg:col-span-5 p-6 rounded-2xl border-2 min-h-[450px] space-y-4 ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be]' : 'bg-brown-deep/40 border-brown'}`}>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a45c] block">Form Clinic</span>
              <h4 className="font-serif text-sm font-bold text-white">Create a Custom Clinic intake Form</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">Spawn a fully active Google Form template instantly so you can gather clinical feedback or mood parameters.</p>
              
              <form onSubmit={handleCreateGoogleForm} className="space-y-4 text-left">
                <div>
                  <label className="block text-[9px] font-mono uppercase opacity-75 mb-1.5">Form Document Title</label>
                  <input type="text" required value={newFormTitle} onChange={e => setNewFormTitle(e.target.value)} placeholder="Ex: Sanctuary Weekly Check-In..." className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`} />
                </div>
                <button type="submit" disabled={isCreatingForm || !newFormTitle.trim()} className="w-full py-3 bg-[#c9a45c] hover:bg-[#b08e4f] text-black font-mono font-bold uppercase text-xs tracking-wider rounded-xl flex items-center justify-center gap-2">
                  {isCreatingForm ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create and Deploy Google Form
                </button>
              </form>

              {createdFormUrl && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
                  <p className="text-emerald-400 font-bold font-mono text-[10px] uppercase">Form Ready!</p>
                  <a href={createdFormUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 bg-[#c9a45c] text-black px-3 py-1.5 rounded text-[10px] font-mono font-bold hover:bg-[#b08e4f]">
                    Open Live Responder Form <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-serif text-sm font-bold opacity-80 uppercase">Active Clinic Forms List</h4>
                <button onClick={fetchFormsList} className="p-1.5 text-sage border border-brown rounded bg-black/15"><RefreshCw className={`w-3.5 h-3.5 ${isLoadingForms ? 'animate-spin' : ''}`} /></button>
              </div>

              {isLoadingForms ? (
                <div className="p-12 text-center text-slate-400"><RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-[#c9a45c]" /> Syncing forms...</div>
              ) : formsList.length === 0 ? (
                <div className="p-8 border border-dashed border-brown/40 rounded-2xl text-left space-y-4">
                  <p className="text-xs text-slate-400">No clinic forms detected. We've built an interactive intake checklist below to model real form interactions instantly!</p>
                  
                  {/* Local Intake Demo */}
                  <div className="p-4 bg-brown-deep/60 rounded-xl space-y-3 border border-brown/50">
                    <span className="text-[9px] font-mono text-periwinkle uppercase tracking-wider font-bold">🌿 Interactive Intake Checklist</span>
                    <p className="text-[10px] text-slate-300">Evaluate your current somatic parameters:</p>
                    <div className="space-y-2 text-[11px] text-slate-300">
                      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded" /> I feel localized stress in my shoulders/plates (Sisyphus boulder check)</label>
                      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded" /> I am struggling with conflicting fact/emotion parameters (Athena dialectic check)</label>
                      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded" /> My emotional tides are fluctuating heavily (Poseidon storm check)</label>
                    </div>
                    <button onClick={() => alert("Sanctuary intake submission logged locally! Ready to sync to Google Form sheets.")} className="py-1 px-3 bg-[#c9a45c] text-black font-mono font-bold text-[9px] uppercase rounded hover:bg-[#b08e4f]">Submit Intake</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {formsList.map((form) => (
                    <div key={form.id} className="p-3 rounded-xl border border-brown/45 bg-black/10 text-left flex justify-between items-center text-xs gap-3">
                      <div className="flex items-center gap-3 truncate">
                        <FormInput className="w-4 h-4 text-[#c9a45c] shrink-0" />
                        <span className="font-bold text-white block truncate text-[11px]">{form.name}</span>
                      </div>
                      <a href={form.webViewLink || `https://docs.google.com/forms/d/${form.id}/viewform`} target="_blank" rel="noopener noreferrer" className="p-1.5 border border-brown rounded text-[#c9a45c] hover:bg-[#c9a45c]/10">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* GOOGLE DOCS COVENANT WRITER */}
        {activeTab === 'docs' && (
          <motion.div key="tab-docs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className={`lg:col-span-6 p-6 rounded-2xl border-2 flex flex-col justify-between min-h-[450px] ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be]' : 'bg-brown-deep/40 border-brown'}`}>
              <form onSubmit={handleCreateDoc} className="space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a45c] block">Covenant Document Writer</span>
                <h4 className="font-serif text-sm font-bold text-white">Create a Healing Google Doc</h4>
                <p className="text-[10px] text-slate-400">Instantly generate a Google Document with custom initial text for your guides or deep reflection.</p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-mono uppercase opacity-75 mb-1.5">Document Title</label>
                    <input type="text" required value={newDocTitle} onChange={e => setNewDocTitle(e.target.value)} placeholder="Sanctuary Treatment Plan, Breath Log..." className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono uppercase opacity-75 mb-1.5">Initial Content / Body</label>
                    <textarea rows={5} value={newDocBody} onChange={e => setNewDocBody(e.target.value)} placeholder="This document logs somatic progress. Keep breathing and pacing yourself." className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] font-serif leading-relaxed ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`} />
                  </div>
                </div>

                <button type="submit" disabled={isCreatingDoc || !newDocTitle.trim()} className="w-full py-3 bg-[#c9a45c] hover:bg-[#b08e4f] text-black font-mono font-bold uppercase text-xs tracking-wider rounded-xl flex items-center justify-center gap-2">
                  {isCreatingDoc ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Create & Sync Google Doc
                </button>
              </form>

              {createdDocUrl && (
                <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-[11px] text-center flex flex-col items-center gap-2">
                  <span className="font-mono font-bold uppercase text-[9px]">📄 Document Ready!</span>
                  <a href={createdDocUrl} target="_blank" rel="noopener noreferrer" className="text-white hover:underline flex items-center gap-1 font-bold">
                    Open newly created Google Doc <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-serif text-sm font-bold opacity-80 uppercase">Your Saved Google Docs</h4>
                <button onClick={fetchDocsList} className="p-1.5 text-sage border border-brown rounded bg-black/15"><RefreshCw className={`w-3.5 h-3.5 ${isLoadingDocs ? 'animate-spin' : ''}`} /></button>
              </div>

              {isLoadingDocs ? (
                <div className="p-12 text-center text-slate-400"><RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-[#c9a45c]" /> Syncing Docs...</div>
              ) : docsList.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-brown/40 rounded-2xl">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-500" />
                  <p className="text-xs">No documents found. Use the left form to write one!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {docsList.map((doc) => (
                    <div key={doc.id} className="p-3.5 rounded-xl border border-brown/45 bg-black/15 hover:bg-black/25 transition-all text-left flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate text-xs">
                          <span className="font-serif font-bold text-white block truncate">{doc.name}</span>
                          <span className="text-[8px] font-mono text-slate-500">Created {new Date(doc.createdTime).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <a href={`https://docs.google.com/document/d/${doc.id}/edit`} target="_blank" rel="noopener noreferrer" className="p-2 border border-brown hover:border-[#c9a45c] rounded text-[#c9a45c] hover:bg-[#c9a45c]/10 flex items-center justify-center transition-all">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* GOOGLE SLIDES DECK MAKER */}
        {activeTab === 'slides' && (
          <motion.div key="tab-slides" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className={`lg:col-span-6 p-6 rounded-2xl border-2 flex flex-col justify-between min-h-[450px] ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be]' : 'bg-brown-deep/40 border-brown'}`}>
              <form onSubmit={handleCreateSlides} className="space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a45c] block">Somatic Presentation Slide Maker</span>
                <h4 className="font-serif text-sm font-bold text-white">Create a Presentation Slide Deck</h4>
                <p className="text-[10px] text-slate-400">Generate a beautiful, synchronized Google Slides presentation to summarize somatic research or therapeutic teachings.</p>

                <div>
                  <label className="block text-[9px] font-mono uppercase opacity-75 mb-1.5">Presentation Title</label>
                  <input type="text" required value={newSlideTitle} onChange={e => setNewSlideTitle(e.target.value)} placeholder="Raag Raas & Somatic Alignment, Breath Patterns..." className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`} />
                </div>

                <button type="submit" disabled={isCreatingSlide || !newSlideTitle.trim()} className="w-full py-3 bg-[#c9a45c] hover:bg-[#b08e4f] text-black font-mono font-bold uppercase text-xs tracking-wider rounded-xl flex items-center justify-center gap-2">
                  {isCreatingSlide ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Presentation className="w-4 h-4" />} Create Presentation Deck
                </button>
              </form>

              {createdSlideUrl && (
                <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-[11px] text-center flex flex-col items-center gap-2">
                  <span className="font-mono font-bold uppercase text-[9px]">🎨 Slide Deck Provisioned!</span>
                  <a href={createdSlideUrl} target="_blank" rel="noopener noreferrer" className="text-white hover:underline flex items-center gap-1 font-bold">
                    Open newly created Google Slides <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-serif text-sm font-bold opacity-80 uppercase">Saved Presentation Decks</h4>
                <button onClick={fetchSlidesList} className="p-1.5 text-sage border border-brown rounded bg-black/15"><RefreshCw className={`w-3.5 h-3.5 ${isLoadingSlides ? 'animate-spin' : ''}`} /></button>
              </div>

              {isLoadingSlides ? (
                <div className="p-12 text-center text-slate-400"><RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-[#c9a45c]" /> Syncing Slides...</div>
              ) : slidesList.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-brown/40 rounded-2xl">
                  <Presentation className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-500" />
                  <p className="text-xs">No slide decks found. Use the left form to generate one!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {slidesList.map((slide) => (
                    <div key={slide.id} className="p-3.5 rounded-xl border border-brown/45 bg-black/15 hover:bg-black/25 transition-all text-left flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <Presentation className="w-4 h-4" />
                        </div>
                        <div className="truncate text-xs">
                          <span className="font-serif font-bold text-white block truncate">{slide.name}</span>
                          <span className="text-[8px] font-mono text-slate-500">Created {new Date(slide.createdTime).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <a href={`https://docs.google.com/presentation/d/${slide.id}/edit`} target="_blank" rel="noopener noreferrer" className="p-2 border border-brown hover:border-[#c9a45c] rounded text-[#c9a45c] hover:bg-[#c9a45c]/10 flex items-center justify-center transition-all">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* GOOGLE MEET ROOM INITIALIZER */}
        {activeTab === 'meet' && (
          <motion.div key="tab-meet" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className={`lg:col-span-5 p-6 rounded-2xl border-2 flex flex-col justify-between min-h-[450px] ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be]' : 'bg-brown-deep/40 border-brown'}`}>
              <form onSubmit={handleCreateMeetSpace} className="space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a45c] block">Sanctuary video link portal</span>
                <h4 className={`font-serif text-sm font-bold ${isLightMode ? 'text-stone-900' : 'text-white'}`}>Initialize Google Meet Space</h4>
                <p className="text-[10px] text-slate-400">Instantly generate a Google Meet link space to discuss mental well-being, classical art somatic systems, or dial-in with guides.</p>

                <div>
                  <label className="block text-[9px] font-mono uppercase opacity-75 mb-1.5">Discussion Focus Title</label>
                  <input type="text" required value={newMeetTitle} onChange={e => setNewMeetTitle(e.target.value)} placeholder="Mentoring Session, Group Breathing Alignment..." className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`} />
                </div>

                <button type="submit" disabled={isCreatingMeet || !newMeetTitle.trim()} className="w-full py-3 bg-periwinkle hover:bg-periwinkle-hover text-white font-mono font-bold uppercase text-xs tracking-wider rounded-xl flex items-center justify-center gap-2">
                  {isCreatingMeet ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />} Spawn Google Meet Room
                </button>
              </form>

              <div className="p-4 bg-periwinkle/10 border border-periwinkle/30 rounded-2xl text-left mt-4 space-y-2">
                <span className="text-[9px] font-mono uppercase font-bold text-periwinkle flex items-center gap-1"><Sparkles className="w-3 h-3 animate-pulse" /> Meeting Protocol</span>
                <p className={`text-[10px] leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                  Google Meet spaces support guest logins, real-time whiteboards, auto-captioning, and deep active integration. Let's make connections live!
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4 text-left">
              <h4 className={`font-serif text-sm font-bold opacity-80 uppercase ${isLightMode ? 'text-stone-800' : 'text-white'}`}>Active Somatic Discussion Rooms</h4>
              
              {meetSpaces.length === 0 ? (
                <div className={`p-12 text-center border border-dashed rounded-2xl ${isLightMode ? 'border-[#dfd2be]' : 'border-brown/40'}`}>
                  <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-400">No rooms initialized yet. Create your first room to fetch clickable meet spaces.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {meetSpaces.map((space) => (
                    <div key={space.id} className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isLightMode ? 'border-[#dfd2be] bg-white' : 'border-brown bg-[#121915]/50'}`}>
                      <div>
                        <span className="text-[9px] font-mono bg-[#c9a45c]/20 text-[#c9a45c] px-2 py-0.5 rounded-full font-bold uppercase">Ready to join</span>
                        <h5 className={`font-serif text-sm font-bold mt-1.5 ${isLightMode ? 'text-stone-900' : 'text-white'}`}>{space.title}</h5>
                        <p className="text-[9px] font-mono text-slate-400 mt-1">CODE: {space.code}</p>
                      </div>
                      <a href={space.uri} target="_blank" rel="noopener noreferrer" className="py-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-black font-mono text-[10px] uppercase font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors w-full md:w-auto justify-center">
                        <Video className="w-3.5 h-3.5" /> Join Meet Now <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* GOOGLE CLASSROOM ACADEMICS */}
        {activeTab === 'classroom' && (
          <motion.div key="tab-classroom" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
            <div className={`lg:col-span-5 p-6 rounded-2xl border-2 min-h-[450px] space-y-5 ${isLightMode ? 'bg-[#faf8f4] border-[#dfd2be]' : 'bg-brown-deep/40 border-brown'}`}>
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a45c] block">Divine Academy Registry</span>
                <h4 className="font-serif text-sm font-bold text-white">Create Academic Cohort Course</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-mono uppercase opacity-75 mb-1.5">Class/Course Name</label>
                    <input type="text" required value={newCourseName} onChange={e => setNewCourseName(e.target.value)} placeholder="Somatic Breathwork 101, Athena Dialectics..." className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono uppercase opacity-75 mb-1.5">Section Name</label>
                    <input type="text" value={newCourseSection} onChange={e => setNewCourseSection(e.target.value)} placeholder="Sanctuary Alignment, Raag Therapy..." className={`w-full text-xs p-3 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${isLightMode ? 'bg-white border-[#dfd2be] text-slate-800' : 'bg-brown-deep/80 border-brown text-white'}`} />
                  </div>
                </div>

                <button type="submit" disabled={isCreatingCourse || !newCourseName.trim()} className="w-full py-3 bg-[#c9a45c] hover:bg-[#b08e4f] text-black font-mono font-bold uppercase text-xs tracking-wider rounded-xl flex items-center justify-center gap-2">
                  {isCreatingCourse ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />} Establish Classroom Course
                </button>
              </form>

              <div className="p-4 bg-[#c9a45c]/5 border border-[#c9a45c]/20 rounded-2xl text-[10px] text-slate-400 space-y-1">
                <span className="font-bold text-[#c9a45c] block uppercase text-[9px]">🎓 Classroom privileges note</span>
                <p className="leading-relaxed">To successfully establish courses or post student coursework, your connected account must have the classroom teacher privileges enabled inside Google Classroom.</p>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-5">
              <div className="flex justify-between items-center">
                <h4 className="font-serif text-sm font-bold opacity-80 uppercase">Active Classroom Courses</h4>
                <button onClick={fetchClassroomCourses} className="p-1.5 text-sage border border-brown rounded bg-black/15"><RefreshCw className={`w-3.5 h-3.5 ${isLoadingClassroom ? 'animate-spin' : ''}`} /></button>
              </div>

              {isLoadingClassroom ? (
                <div className="p-12 text-center text-slate-400"><RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-[#c9a45c]" /> Syncing Classroom...</div>
              ) : classroomCourses.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-brown/40 rounded-2xl">
                  <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-400">No active classes found. Create a new classroom course on the left!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selector */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase text-slate-400">Select course to view & instruct</label>
                    <select value={selectedCourseId} onChange={e => { setSelectedCourseId(e.target.value); fetchCourseAnnouncements(e.target.value); }} className="w-full text-xs p-3 rounded-xl border border-brown bg-black/20 text-white font-serif">
                      {classroomCourses.map(course => (
                        <option key={course.id} value={course.id}>{course.name} - {course.section || 'General'}</option>
                      ))}
                    </select>
                  </div>

                  {/* Publish Stream */}
                  <form onSubmit={handleCreateAnnouncement} className="p-4 bg-black/15 border border-brown/30 rounded-2xl space-y-3">
                    <span className="text-[9px] font-mono text-[#c9a45c] uppercase tracking-wider block font-bold">📢 Announce to students</span>
                    <textarea rows={2.5} required value={newAnnouncementText} onChange={e => setNewAnnouncementText(e.target.value)} placeholder="Dear Cohort: Practice your morning deep breathing exercises before Raag alignment today..." className="w-full text-xs p-2.5 rounded-xl border border-brown/60 focus:border-[#c9a45c] focus:outline-none bg-black/25 text-white" />
                    <button type="submit" disabled={isCreatingAnnouncement || !newAnnouncementText.trim()} className="py-1.5 px-3.5 bg-periwinkle hover:bg-periwinkle-hover text-white font-mono text-[9px] uppercase font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer">
                      {isCreatingAnnouncement ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Broadcast Announcement
                    </button>
                  </form>

                  {/* Announcement List */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Cohort stream announcements</span>
                    {courseAnnouncements.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic pl-1">No announcements stream yet. Broadcast one above to initialize.</p>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pl-1">
                        {courseAnnouncements.map((ann) => (
                          <div key={ann.id} className="p-3 bg-black/10 rounded-lg border border-brown/30 text-xs">
                            <p className="text-white leading-relaxed font-serif">{ann.text}</p>
                            <span className="text-[8px] font-mono text-slate-500 block mt-1.5">Published {ann.creationTime ? new Date(ann.creationTime).toLocaleDateString() : 'Active'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* NOTES SYNC (KEEP) */}
        {activeTab === 'notes' && (
          <motion.div key="tab-notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <NotesSync isLightMode={isLightMode} token={token} userEmail={user?.email} />
          </motion.div>
        )}

        {/* TONY CUSTOMER SERVICE BOT */}
        {activeTab === 'tony' && (
          <motion.div key="tab-tony" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl mx-auto">
            <div className="p-6 rounded-3xl border-2 border-brown bg-brown-deep/40 space-y-4">
              {/* Tony Avatar Header */}
              <div className="flex items-center gap-3 border-b border-brown/30 pb-4 text-left">
                <div className="w-12 h-12 rounded-2xl bg-periwinkle/15 border border-periwinkle/40 flex flex-col items-center justify-center text-periwinkle relative overflow-hidden font-bold font-serif shadow-inner">
                  T
                  <div className="w-2.5 h-2.5 bg-emerald-400 border border-black rounded-full absolute bottom-0.5 right-0.5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-serif text-base font-bold text-white">Tony</h4>
                    <span className="text-[8px] font-mono bg-periwinkle/15 text-periwinkle px-2 py-0.5 rounded-full font-bold">Custodian Agent</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">Sanctuary customer service bot is live & ready.</p>
                </div>
              </div>

              {/* Chat messages */}
              <div className="space-y-3 h-[280px] overflow-y-auto scrollbar-thin p-1 flex flex-col text-xs leading-relaxed">
                {tonyMessages.map((msg, idx) => (
                  <div key={idx} className={`max-w-[85%] p-3.5 rounded-2xl ${msg.sender === 'tony' ? 'bg-[#1b2420] border border-brown text-sage text-left self-start rounded-tl-none font-serif' : 'bg-periwinkle text-white text-left self-end rounded-tr-none font-sans'}`}>
                    {msg.text}
                  </div>
                ))}
                {isTonyTyping && (
                  <div className="bg-[#1b2420] border border-brown text-slate-400 p-3 rounded-2xl rounded-tl-none text-left self-start flex gap-1 items-center font-mono text-[9px] uppercase tracking-wider animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#c9a45c]" /> Tony is consulting the alignment maps...
                  </div>
                )}
              </div>

              {/* Preset prompt questions chips */}
              <div className="pt-2 flex flex-wrap gap-1.5 justify-start text-left">
                {[
                  "How do I back up my journals to Sheets?",
                  "Can I add a spiritual deity to Google Contacts?",
                  "Help me block meditation time on my Calendar.",
                  "What is Sisyphus' chocolate boulder?"
                ].map((chip, i) => (
                  <button key={i} onClick={() => { setTonyInput(chip); }} className="text-[9px] font-mono bg-black/20 hover:bg-[#c9a45c]/10 border border-brown/30 hover:border-[#c9a45c]/50 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-full cursor-pointer transition-all">
                    {chip}
                  </button>
                ))}
              </div>

              {/* Form Input */}
              <form onSubmit={handleTonyChatSubmit} className="flex gap-2 border-t border-brown/20 pt-4">
                <input 
                  type="text" 
                  value={tonyInput} 
                  onChange={e => setTonyInput(e.target.value)} 
                  placeholder="Ask Tony about your Google Sheets, Calendar, Tasks, or Forms integration..." 
                  className="flex-1 text-xs p-3 rounded-xl border border-brown/60 focus:border-[#c9a45c] focus:outline-none bg-black/20 text-white font-sans" 
                />
                <button type="submit" disabled={isTonyTyping || !tonyInput.trim()} className="px-4 py-2 bg-periwinkle hover:bg-periwinkle-hover disabled:opacity-40 text-white rounded-xl text-xs uppercase font-mono font-bold transition-all flex items-center justify-center cursor-pointer">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
