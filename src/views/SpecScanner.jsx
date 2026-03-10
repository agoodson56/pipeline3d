import { useState, useRef, useCallback } from 'react';
import { fmt } from '../utils.js';

/* ────────────────────────────────────────────────────────────
   Spec Scanner — AI-powered Specification Document Analyzer
   Scans construction / LV spec documents and extracts:
   • Scope of Work requirements
   • Material & equipment specs
   • Standards & compliance requirements
   • Scheduling & milestone requirements
   • Special conditions & qualifications
   • Generates a customer requirements matrix
   ──────────────────────────────────────────────────────────── */

async function askGemini(prompt, maxTokens = 4096) {
    const token = localStorage.getItem('p3d_auth_token') || '';
    const res = await fetch('/api/ai', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prompt, maxTokens }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'AI request failed');
    }
    const data = await res.json();
    return data?.text || '';
}

// Parse structured output from Gemini into sections
function parseSpecSections(text) {
    const sections = [];
    let current = null;
    const lines = text.split('\n');
    for (const line of lines) {
        // Detect section headers (bold markdown)
        const headerMatch = line.match(/^\*\*(\d+\.?\s*)?(.*?)\*\*:?\s*$/);
        if (headerMatch) {
            if (current) sections.push(current);
            current = { title: headerMatch[2].trim(), items: [], raw: '' };
            continue;
        }
        if (line.startsWith('## ') || line.startsWith('### ')) {
            if (current) sections.push(current);
            current = { title: line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim(), items: [], raw: '' };
            continue;
        }
        if (current) {
            current.raw += line + '\n';
            const bulletMatch = line.match(/^[\s]*[•\-\*]\s+(.+)/);
            const numberedMatch = line.match(/^[\s]*(\d+)\.\s+(.+)/);
            if (bulletMatch) {
                current.items.push(bulletMatch[1].replace(/\*\*/g, ''));
            } else if (numberedMatch) {
                current.items.push(numberedMatch[2].replace(/\*\*/g, ''));
            }
        }
    }
    if (current) sections.push(current);
    return sections;
}

// Section icons map
const SECTION_ICONS = {
    'scope': '🎯',
    'material': '🔩',
    'equipment': '🔩',
    'standard': '📐',
    'compliance': '📐',
    'code': '📐',
    'schedule': '📅',
    'timeline': '📅',
    'milestone': '📅',
    'special': '⚠️',
    'condition': '⚠️',
    'qualification': '🏅',
    'requirement': '📋',
    'labor': '👷',
    'personnel': '👷',
    'testing': '🔬',
    'commissioning': '🔬',
    'warranty': '🛡️',
    'documentation': '📄',
    'training': '🎓',
    'submittal': '📤',
    'exclusion': '🚫',
    'alternation': '🔄',
    'risk': '⚡',
    'budget': '💰',
    'cost': '💰',
    'safety': '🦺',
};

function getSectionIcon(title) {
    const lower = title.toLowerCase();
    for (const [key, icon] of Object.entries(SECTION_ICONS)) {
        if (lower.includes(key)) return icon;
    }
    return '📋';
}

export default function SpecScanner({ deals, toast }) {
    const [tab, setTab] = useState('scan');
    const [specText, setSpecText] = useState('');
    const [fileName, setFileName] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    const [parsedSections, setParsedSections] = useState([]);
    const [selectedDealId, setSelectedDealId] = useState('');
    const [expandedSections, setExpandedSections] = useState({});
    const [bomResult, setBomResult] = useState('');
    const [bomParsed, setBomParsed] = useState([]);
    const [actionItems, setActionItems] = useState([]);
    const [complianceMatrix, setComplianceMatrix] = useState('');
    const [scanHistory, setScanHistory] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    // Extract text from PDF using pdf.js
    const extractPdfText = useCallback(async (file) => {
        // Load pdf.js from CDN if not already loaded
        if (!window.pdfjsLib) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                script.onload = resolve;
                script.onerror = () => reject(new Error('Failed to load PDF reader'));
                document.head.appendChild(script);
            });
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const textParts = [];
        const maxPages = Math.min(pdf.numPages, 30); // cap at 30 pages
        for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            if (pageText.trim()) textParts.push(pageText);
        }
        return textParts.join('\n\n');
    }, []);

    // Read text file content
    const readFile = useCallback((file) => {
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            return extractPdfText(file);
        }
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }, [extractPdfText]);

    // Handle file upload
    const handleFileUpload = useCallback(async (file) => {
        if (!file) return;
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const maxSize = isPdf ? 2 * 1024 * 1024 : 500 * 1024; // 2MB for PDFs, 500KB for text
        if (file.size > maxSize) {
            toast(`File too large. Max ${isPdf ? '2MB' : '500KB'}.`, 'error');
            return;
        }
        setFileName(file.name);
        try {
            toast(isPdf ? '📄 Reading PDF…' : '📄 Loading file…');
            const text = await readFile(file);
            if (!text || text.trim().length < 50) {
                toast('File appears empty or unreadable. Try pasting the spec text directly.', 'error');
                return;
            }
            // Trim to reasonable length for AI
            const trimmed = text.substring(0, 30000);
            setSpecText(trimmed);
            toast(`📄 Loaded: ${file.name} (${(text.length / 1024).toFixed(1)}KB extracted)`);
        } catch (err) {
            toast('Failed to read file: ' + err.message, 'error');
        }
    }, [readFile, toast]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileUpload(file);
    }, [handleFileUpload]);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    }, []);

    // ─── CORE AI ANALYSIS ─────────────────────────────────────
    const handleAnalyzeSpec = async () => {
        if (!specText.trim()) {
            toast('Please upload or paste specification text first.', 'error');
            return;
        }
        setAnalyzing(true);
        setAnalysisResult('');
        setParsedSections([]);
        setBomResult('');
        setBomParsed([]);
        setActionItems([]);
        setComplianceMatrix('');
        setTab('results');

        try {
            const dealContext = selectedDealId
                ? (() => {
                    const d = deals.find(x => x.id == selectedDealId);
                    return d ? `\nRelated Deal: "${d.title}" — ${d.company || 'N/A'} — $${d.value?.toLocaleString() || 'TBD'} — Stage: ${d.stage}` : '';
                })()
                : '';

            const prompt = `You are a **Specification Analyst** and **Project Estimator** for 3D Technology Services Inc. (3DTSI), a licensed low-voltage systems integrator specializing in Structured Cabling, CCTV/Video Surveillance, Access Control, Fire Alarm, Intrusion Detection, Audio Visual, DAS, and Networking.
${dealContext}

Analyze the following specification document and extract a complete, structured breakdown of what the customer requires. This will be used to build out the project scope and prepare a bid response.

SPECIFICATION TEXT:
"""
${specText.substring(0, 8000)}
"""

Provide your analysis in EXACTLY this format with these section headers. Be exhaustive — extract EVERY requirement:

**Scope of Work Requirements**
• [List every deliverable and scope item the spec requires]
• [Be specific: quantities, locations, system types]
• [Example: Install 45 Cat6A drops in Building A, Floors 1-3]

**Material & Equipment Specifications**
• [Every material, brand, model requirement mentioned]
• [Cable types, device models, panel specs, accessories]
• [Note if "or approved equal" is allowed]

**Standards & Compliance Requirements**
• [Every code, standard, certification referenced]
• [BICSI, NFPA, NEC, UL listings, ADA, local AHJ, OSHA]
• [Manufacturer certifications required]

**Schedule & Milestone Requirements**
• [Project timeline requirements]
• [Phasing, milestones, substantial completion dates]
• [Work hour restrictions, shutdown requirements]

**Testing & Commissioning Requirements**
• [All testing requirements mentioned]
• [Certification testing, acceptance criteria]
• [Documentation and as-built requirements]

**Submittal & Documentation Requirements**
• [Shop drawings, product data, samples required]
• [O&M manuals, as-built drawings, test reports]
• [Training requirements for end users]

**Special Conditions & Qualifications**
• [Insurance, bonding, licensing requirements]
• [Prevailing wage, union requirements]
• [Security clearance, background checks]
• [Liquidated damages, penalty clauses]

**Exclusions & Risks**
• [Items NOT included or explicitly excluded]
• [Ambiguous requirements that could be risk areas]
• [Items requiring clarification via RFI]

**Customer Priority Matrix**
Rate each area as 🔴 Critical | 🟡 Important | 🟢 Standard based on the spec language:
• [System Performance]: [rating + reason]
• [Code Compliance]: [rating + reason]
• [Schedule]: [rating + reason]
• [Budget]: [rating + reason]
• [Aesthetics]: [rating + reason]
• [Documentation]: [rating + reason]

**Estimated Project Complexity**: [Low / Medium / High / Very High]
**Recommended Bid Strategy**: [2-3 sentences on how 3DTSI should approach this bid]

Be thorough, precise, and technical. Reference specific spec section numbers when available.`;

            const result = await askGemini(prompt, 6000);
            setAnalysisResult(result);
            const sections = parseSpecSections(result);
            setParsedSections(sections);

            // Auto-expand all sections
            const expanded = {};
            sections.forEach((_, i) => expanded[i] = true);
            setExpandedSections(expanded);

            // Add to history
            setScanHistory(h => [{
                id: Date.now(),
                name: fileName || 'Pasted Spec',
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                sections: sections.length,
                deal: selectedDealId ? deals.find(d => d.id == selectedDealId)?.title : null,
            }, ...h].slice(0, 10));

            toast('✅ Specification analysis complete!');
        } catch (e) {
            setAnalysisResult('⚠️ Analysis failed: ' + e.message);
            toast('Analysis failed: ' + e.message, 'error');
        }
        setAnalyzing(false);
    };

    // ─── GENERATE BOM FROM SPEC ───────────────────────────────
    const handleGenerateBOM = async () => {
        if (!analysisResult) return;
        setAnalyzing(true);
        setBomResult('');
        try {
            const prompt = `Based on this specification analysis, generate a detailed Bill of Materials (BOM) for 3D Technology Services Inc.

SPECIFICATION ANALYSIS:
"""
${analysisResult.substring(0, 6000)}
"""

Generate a professional BOM in this EXACT format:

**Bill of Materials — Estimated Quantities**

| # | Category | Item Description | Part/Model | Qty | Unit | Est. Unit Cost | Est. Total |
|---|----------|-----------------|------------|-----|------|---------------|-----------|
| 1 | [Cabling] | [Cat6A Plenum Cable] | [Belden 10GXS] | [50] | [Box/1000ft] | [$250] | [$12,500] |
[Continue for ALL items extracted from the spec...]

**Labor Estimate Summary**
| Phase | Description | Est. Hours | Rate | Cost |
|-------|------------|-----------|------|------|
| [Phase] | [Description] | [Hours] | [$75/hr] | [Total] |

**Material Subtotal**: $XX,XXX
**Labor Subtotal**: $XX,XXX
**Estimated Project Total**: $XX,XXX
**Recommended Markup (15-25%)**: $XX,XXX
**Proposed Bid Price**: $XX,XXX

Include realistic industry-standard pricing for the low-voltage trade. Be specific about quantities based on the spec.`;

            const result = await askGemini(prompt, 5000);
            setBomResult(result);
            toast('📦 BOM generated from specification!');
        } catch (e) {
            setBomResult('⚠️ ' + e.message);
        }
        setAnalyzing(false);
    };

    // ─── GENERATE ACTION ITEMS ────────────────────────────────
    const handleGenerateActions = async () => {
        if (!analysisResult) return;
        setAnalyzing(true);
        setActionItems([]);
        try {
            const prompt = `Based on this specification analysis for 3D Technology Services Inc., generate a prioritized action item checklist to respond to this RFP/spec and win the bid.

SPECIFICATION ANALYSIS:
"""
${analysisResult.substring(0, 5000)}
"""

Generate EXACTLY this format — a numbered action list with priority, assignee role, and deadline:

**Pre-Bid Actions (Before Bid Due Date)**
1. 🔴 [CRITICAL] [Action item] — Assign: [Project Manager/Estimator/Field Lead] — Due: [Day 1-3]
2. 🟡 [IMPORTANT] [Action item] — Assign: [Role] — Due: [Day X]
[Continue...]

**Bid Preparation Actions**
1. 🔴 [CRITICAL] [Action item] — Assign: [Role] — Due: [Day X]
[Continue...]

**Post-Award Actions (If Won)**
1. 🔴 [CRITICAL] [Action item] — Assign: [Role] — Due: [Week X]
[Continue...]

**RFI Questions to Submit**
1. [Question about ambiguous specification requirement] — Spec Section: [X.X]
[Continue...]

Include at minimum 15 total action items across all categories. Be specific to the low-voltage trade.`;

            const result = await askGemini(prompt, 4000);
            setActionItems([{ title: 'Action Plan', raw: result, items: [] }]);
            toast('✅ Action items generated!');
        } catch (e) {
            setActionItems([{ title: 'Error', raw: '⚠️ ' + e.message, items: [] }]);
        }
        setAnalyzing(false);
    };

    // ─── GENERATE COMPLIANCE MATRIX ───────────────────────────
    const handleComplianceMatrix = async () => {
        if (!analysisResult) return;
        setAnalyzing(true);
        setComplianceMatrix('');
        try {
            const prompt = `Based on this specification analysis for 3D Technology Services Inc. (3DTSI), generate a comprehensive Compliance Matrix showing 3DTSI's compliance status for every requirement.

SPECIFICATION ANALYSIS:
"""
${analysisResult.substring(0, 5000)}
"""

Generate a professional compliance matrix in this EXACT table format:

**Specification Compliance Matrix — 3D Technology Services Inc.**

| # | Spec Section | Requirement | 3DTSI Status | Notes |
|---|-------------|------------|-------------|-------|
| 1 | [Section #] | [Requirement description] | ✅ Compliant | [How 3DTSI meets this] |
| 2 | [Section #] | [Requirement description] | ✅ Exceeds | [How 3DTSI exceeds this] |
| 3 | [Section #] | [Requirement description] | ⚠️ Exception | [What the exception is and proposed alternative] |
| 4 | [Section #] | [Requirement description] | ❓ Clarification Needed | [What needs to be clarified via RFI] |
[Continue for EVERY requirement identified — minimum 15 rows]

**Compliance Summary**
- ✅ Compliant: X items
- ✅ Exceeds: X items
- ⚠️ Exceptions: X items
- ❓ Clarifications: X items
- **Overall Compliance Rate**: XX%

**Competitive Advantages**
• [3 specific advantages 3DTSI brings to this project]

Be thorough. Every requirement from the spec should appear in this matrix.`;

            const result = await askGemini(prompt, 5000);
            setComplianceMatrix(result);
            toast('📋 Compliance matrix generated!');
        } catch (e) {
            setComplianceMatrix('⚠️ ' + e.message);
        }
        setAnalyzing(false);
    };

    // Toggle section expansion
    const toggleSection = (index) => {
        setExpandedSections(prev => ({ ...prev, [index]: !prev[index] }));
    };

    // Render markdown helper
    const renderMarkdown = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => {
            // Table rows
            if (line.includes('|') && line.trim().startsWith('|')) {
                const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
                if (cells.every(c => /^[-:]+$/.test(c))) return null; // separator row
                const isHeader = i === 0 || text.split('\n')[i - 1]?.trim() === '' || text.split('\n')[i + 1]?.includes('---');
                return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: `repeat(${cells.length}, 1fr)`, gap: 1, fontSize: 11, marginBottom: 1 }}>
                        {cells.map((cell, ci) => (
                            <div key={ci} style={{
                                padding: '6px 8px',
                                background: isHeader ? 'var(--accent-muted)' : 'var(--bg-surface)',
                                fontWeight: isHeader ? 700 : 400,
                                color: cell.includes('✅') ? '#10b981' : cell.includes('⚠️') ? '#f59e0b' : cell.includes('❓') ? '#3b82f6' : cell.includes('🔴') ? '#ef4444' : 'var(--text-secondary)',
                                borderBottom: '1px solid var(--border)',
                                wordBreak: 'break-word',
                            }}>{cell.replace(/\*\*/g, '')}</div>
                        ))}
                    </div>
                );
            }
            if (line.startsWith('**') && line.endsWith('**')) return <div key={i} style={{ fontWeight: 700, fontSize: 14, marginTop: 16, marginBottom: 6, color: 'var(--text-primary)' }}>{line.replace(/\*\*/g, '')}</div>;
            if (line.startsWith('**')) return <div key={i} style={{ fontWeight: 700, fontSize: 13, marginTop: 12, marginBottom: 4, color: 'var(--text-primary)' }}>{line.replace(/\*\*/g, '')}</div>;
            if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) return <div key={i} style={{ fontSize: 12, paddingLeft: 16, marginBottom: 3, color: 'var(--text-secondary)', lineHeight: 1.5 }}>• {line.slice(2).replace(/\*\*/g, '')}</div>;
            if (/^\d+\.\s/.test(line)) {
                const hasEmoji = /^[\d]+\.\s[🔴🟡🟢⚠️✅❓]/.test(line);
                return <div key={i} style={{ fontSize: 12, paddingLeft: hasEmoji ? 8 : 16, marginBottom: 3, color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: hasEmoji ? 600 : 400 }}>{line.replace(/\*\*/g, '')}</div>;
            }
            if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
            return <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 3, lineHeight: 1.5 }}>{line.replace(/\*\*/g, '')}</div>;
        });
    };

    const activeDeals = deals?.filter(d => d.stage !== 'Won' && d.stage !== 'Lost') || [];

    return (
        <div>
            {/* Hero KPIs */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-label">📄 Specs Scanned</div>
                    <div className="kpi-value" style={{ color: '#8b5cf6' }}>{scanHistory.length}</div>
                    <div className="kpi-sub">This session</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">📋 Requirements Found</div>
                    <div className="kpi-value" style={{ color: '#10b981' }}>{parsedSections.reduce((s, sec) => s + sec.items.length, 0)}</div>
                    <div className="kpi-sub">Across all categories</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">📐 Sections Analyzed</div>
                    <div className="kpi-value" style={{ color: '#3b82f6' }}>{parsedSections.length}</div>
                    <div className="kpi-sub">Spec categories</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">💰 Linked Deals</div>
                    <div className="kpi-value" style={{ color: '#f59e0b' }}>{scanHistory.filter(s => s.deal).length}</div>
                    <div className="kpi-sub">Specs tied to deals</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="detail-tabs" style={{ marginBottom: 16 }}>
                <button className={`detail-tab ${tab === 'scan' ? 'active' : ''}`} onClick={() => setTab('scan')}>📄 Upload & Scan</button>
                <button className={`detail-tab ${tab === 'results' ? 'active' : ''}`} onClick={() => setTab('results')} disabled={!analysisResult}>📋 Requirements</button>
                <button className={`detail-tab ${tab === 'bom' ? 'active' : ''}`} onClick={() => setTab('bom')} disabled={!analysisResult}>📦 BOM</button>
                <button className={`detail-tab ${tab === 'actions' ? 'active' : ''}`} onClick={() => setTab('actions')} disabled={!analysisResult}>✅ Action Items</button>
                <button className={`detail-tab ${tab === 'compliance' ? 'active' : ''}`} onClick={() => setTab('compliance')} disabled={!analysisResult}>📐 Compliance</button>
                <button className={`detail-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>🕐 History</button>
            </div>

            {/* ═══ UPLOAD & SCAN TAB ═══ */}
            {tab === 'scan' && (
                <div className="dashboard-grid">
                    <div className="chart-card" style={{ gridColumn: 'span 2' }}>
                        <div className="chart-card-title">📄 Specification Document Scanner</div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                            Upload a specification document or paste the text below. The AI will extract all customer requirements, materials, standards, schedules, and special conditions — building a complete picture of what the customer wants.
                        </p>

                        {/* Deal Selector */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <label className="form-label">Link to Deal (Optional)</label>
                                <select className="form-input" value={selectedDealId} onChange={e => setSelectedDealId(e.target.value)}>
                                    <option value="">— No deal linked —</option>
                                    {activeDeals.map(d => (
                                        <option key={d.id} value={d.id}>{d.title} — {d.company || 'N/A'} ({fmt(d.value)})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Drag & Drop Zone */}
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                border: `2px dashed ${dragActive ? '#8b5cf6' : 'var(--border)'}`,
                                borderRadius: 16,
                                padding: '40px 24px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: dragActive ? 'rgba(139, 92, 246, 0.08)' : 'var(--bg-surface)',
                                marginBottom: 16,
                            }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".txt,.csv,.doc,.docx,.rtf,.md,.pdf"
                                style={{ display: 'none' }}
                                onChange={e => handleFileUpload(e.target.files?.[0])}
                            />
                            <div style={{ fontSize: 48, marginBottom: 12 }}>{dragActive ? '📥' : '📄'}</div>
                            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: 'var(--text-primary)' }}>
                                {fileName ? `✅ ${fileName}` : 'Drop Specification Document Here'}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                or click to browse • Supports .txt, .csv, .md, .rtf, .pdf (text-based)
                            </div>
                        </div>

                        {/* Text paste area */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <label className="form-label" style={{ margin: 0 }}>Or paste specification text directly</label>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{specText.length.toLocaleString()} / 9,000 chars</span>
                            </div>
                            <textarea
                                className="form-input"
                                value={specText}
                                onChange={e => setSpecText(e.target.value.substring(0, 9000))}
                                placeholder="Paste the specification text here... Include sections on scope of work, materials, standards, schedule, and any special conditions."
                                style={{
                                    height: 220,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                    fontSize: 12,
                                    lineHeight: 1.6,
                                    resize: 'vertical',
                                }}
                            />
                        </div>

                        {/* Analyze Button */}
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            {specText && (
                                <button className="btn btn-ghost" onClick={() => { setSpecText(''); setFileName(''); }}>
                                    🗑️ Clear
                                </button>
                            )}
                            <button
                                className="btn btn-primary"
                                onClick={handleAnalyzeSpec}
                                disabled={analyzing || !specText.trim()}
                                style={{
                                    padding: '12px 32px',
                                    fontSize: 15,
                                    fontWeight: 700,
                                    background: analyzing ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                                    border: 'none',
                                }}
                            >
                                {analyzing ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span className="spinner" style={{ width: 16, height: 16 }} />
                                        Analyzing Specification…
                                    </span>
                                ) : (
                                    '🧠 Scan & Analyze Specification'
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="chart-card">
                        <div className="chart-card-title">💡 Tips for Best Results</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                <span>🎯</span>
                                <span>Include the <strong>full scope of work</strong> section from the spec document</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                <span>📐</span>
                                <span>Include <strong>applicable standards & codes</strong> referenced in the spec</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                <span>🔩</span>
                                <span>Include <strong>material specifications</strong> with brands, models, or "approved equal" language</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                <span>📅</span>
                                <span>Include <strong>schedule requirements</strong> and milestone dates</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                <span>⚠️</span>
                                <span>Include <strong>special conditions</strong> like bonding, insurance, and qualifications</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <span>💰</span>
                                <span><strong>Link to a deal</strong> for context-aware analysis tailored to that opportunity</span>
                            </div>
                        </div>

                        <div style={{ marginTop: 20, padding: 14, background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(109,40,217,0.1))', borderRadius: 12, border: '1px solid rgba(139,92,246,0.2)' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', marginBottom: 6 }}>🧠 AI-Powered Extraction</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                Gemini AI will identify and extract every requirement, material spec, compliance standard, and special condition from your document — building a complete customer requirements matrix.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ RESULTS TAB ═══ */}
            {tab === 'results' && (
                <div>
                    {analyzing && (
                        <div className="chart-card" style={{ textAlign: 'center', padding: 60 }}>
                            <div className="spinner" style={{ margin: '0 auto 16px' }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>🧠 AI scanning specification document with Gemini…</p>
                            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>Extracting requirements, materials, standards, and special conditions</p>
                        </div>
                    )}

                    {parsedSections.length > 0 && !analyzing && (
                        <>
                            {/* Action bar */}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                                <button className="btn btn-primary btn-sm" onClick={handleGenerateBOM} disabled={analyzing}>
                                    📦 Generate BOM
                                </button>
                                <button className="btn btn-sm" onClick={handleGenerateActions} disabled={analyzing}
                                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none' }}>
                                    ✅ Generate Action Items
                                </button>
                                <button className="btn btn-sm" onClick={handleComplianceMatrix} disabled={analyzing}
                                    style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none' }}>
                                    📐 Compliance Matrix
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => {
                                    navigator.clipboard.writeText(analysisResult);
                                    toast('📋 Full analysis copied!');
                                }}>
                                    📋 Copy All
                                </button>
                            </div>

                            {/* Parsed Sections with accordions */}
                            {parsedSections.map((section, i) => (
                                <div key={i} className="chart-card" style={{ marginBottom: 12, overflow: 'hidden' }}>
                                    <div
                                        onClick={() => toggleSection(i)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                                            padding: '4px 0', userSelect: 'none',
                                        }}
                                    >
                                        <span style={{ fontSize: 20 }}>{getSectionIcon(section.title)}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{section.title}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{section.items.length} requirements extracted</div>
                                        </div>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: 'var(--bg-surface)', fontSize: 12, transition: 'transform 0.2s',
                                            transform: expandedSections[i] ? 'rotate(180deg)' : 'rotate(0deg)',
                                        }}>▼</div>
                                    </div>
                                    {expandedSections[i] && (
                                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                                            {section.items.length > 0 ? (
                                                section.items.map((item, j) => (
                                                    <div key={j} style={{
                                                        display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0',
                                                        fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
                                                        borderBottom: j < section.items.length - 1 ? '1px solid var(--border)' : 'none',
                                                    }}>
                                                        <span style={{ color: '#8b5cf6', fontSize: 14, marginTop: 1, flexShrink: 0 }}>•</span>
                                                        <span>{item}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                                    {renderMarkdown(section.raw)}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </>
                    )}

                    {!analysisResult && !analyzing && (
                        <div className="chart-card" style={{ textAlign: 'center', padding: 60 }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                            <h3>No Specification Scanned Yet</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Upload or paste a spec document in the "Upload & Scan" tab, then click Analyze.</p>
                            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setTab('scan')}>📄 Go to Upload</button>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ BOM TAB ═══ */}
            {tab === 'bom' && (
                <div className="chart-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                        <div className="chart-card-title" style={{ margin: 0 }}>📦 Bill of Materials — Generated from Spec</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {!bomResult && (
                                <button className="btn btn-primary" onClick={handleGenerateBOM} disabled={analyzing || !analysisResult}>
                                    {analyzing ? '⏳ Generating…' : '📦 Generate BOM'}
                                </button>
                            )}
                            {bomResult && (
                                <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(bomResult); toast('📋 BOM copied!'); }}>
                                    📋 Copy
                                </button>
                            )}
                        </div>
                    </div>
                    {analyzing && tab === 'bom' && (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <div className="spinner" style={{ margin: '0 auto 12px' }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Generating Bill of Materials from specification…</p>
                        </div>
                    )}
                    {bomResult && (
                        <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', overflowX: 'auto' }}>
                            {renderMarkdown(bomResult)}
                        </div>
                    )}
                    {!bomResult && !analyzing && (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
                            <p style={{ fontSize: 13 }}>Click "Generate BOM" to create a Bill of Materials from the scanned specification.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ ACTION ITEMS TAB ═══ */}
            {tab === 'actions' && (
                <div className="chart-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                        <div className="chart-card-title" style={{ margin: 0 }}>✅ Action Items & RFI Questions</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {actionItems.length === 0 && (
                                <button className="btn btn-primary" onClick={handleGenerateActions} disabled={analyzing || !analysisResult}>
                                    {analyzing ? '⏳ Generating…' : '✅ Generate Actions'}
                                </button>
                            )}
                            {actionItems.length > 0 && (
                                <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(actionItems.map(a => a.raw).join('\n')); toast('📋 Actions copied!'); }}>
                                    📋 Copy
                                </button>
                            )}
                        </div>
                    </div>
                    {analyzing && tab === 'actions' && (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <div className="spinner" style={{ margin: '0 auto 12px' }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Generating action items and RFI questions…</p>
                        </div>
                    )}
                    {actionItems.length > 0 && actionItems.map((section, i) => (
                        <div key={i} style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                            {renderMarkdown(section.raw)}
                        </div>
                    ))}
                    {actionItems.length === 0 && !analyzing && (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                            <p style={{ fontSize: 13 }}>Click "Generate Actions" to create a prioritized action plan from the spec analysis.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ COMPLIANCE MATRIX TAB ═══ */}
            {tab === 'compliance' && (
                <div className="chart-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                        <div className="chart-card-title" style={{ margin: 0 }}>📐 Compliance Matrix</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {!complianceMatrix && (
                                <button className="btn btn-primary" onClick={handleComplianceMatrix} disabled={analyzing || !analysisResult}>
                                    {analyzing ? '⏳ Generating…' : '📐 Generate Matrix'}
                                </button>
                            )}
                            {complianceMatrix && (
                                <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(complianceMatrix); toast('📋 Matrix copied!'); }}>
                                    📋 Copy
                                </button>
                            )}
                        </div>
                    </div>
                    {analyzing && tab === 'compliance' && (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <div className="spinner" style={{ margin: '0 auto 12px' }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Building compliance matrix from specification…</p>
                        </div>
                    )}
                    {complianceMatrix && (
                        <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', overflowX: 'auto' }}>
                            {renderMarkdown(complianceMatrix)}
                        </div>
                    )}
                    {!complianceMatrix && !analyzing && (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: 36, marginBottom: 8 }}>📐</div>
                            <p style={{ fontSize: 13 }}>Click "Generate Matrix" to create a compliance matrix showing 3DTSI's status for each spec requirement.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ HISTORY TAB ═══ */}
            {tab === 'history' && (
                <div className="chart-card">
                    <div className="chart-card-title">🕐 Scan History</div>
                    {scanHistory.length > 0 ? (
                        <div>
                            {scanHistory.map((entry) => (
                                <div key={entry.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                                    borderBottom: '1px solid var(--border)',
                                }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10,
                                        background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.2))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                                    }}>📄</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{entry.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            {entry.date} at {entry.time} · {entry.sections} sections
                                            {entry.deal && <span> · Linked to: <strong>{entry.deal}</strong></span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: 36, marginBottom: 8 }}>🕐</div>
                            <p style={{ fontSize: 13 }}>No scans yet. Upload a specification document to get started.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
