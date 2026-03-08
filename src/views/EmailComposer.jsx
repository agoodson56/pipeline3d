import { useState, useMemo } from 'react';
import * as api from '../api.js';

const TEMPLATES = [
    { id: 'intro', name: 'Introduction', subject: 'Introduction — 3D Technology Services Inc. & {company}', body: 'Hi {contact},\n\nI wanted to introduce myself — I\'m reaching out from 3D Technology Services Inc. I\'d love to share how we can help {company} achieve its technology goals.\n\nWould you be available for a quick call this week to discuss?\n\nBest regards,\n3D Technology Services Inc.\nhttps://3dtsi.com' },
    { id: 'followup', name: 'Follow-Up', subject: 'Following up — {deal}', body: 'Hi {contact},\n\nI wanted to follow up on our previous conversation about {deal}.\n\nDo you have any questions or would you like to schedule a next step? We\'re here to help make this as seamless as possible.\n\nLooking forward to hearing from you.\n\nBest regards,\n3D Technology Services Inc.\nhttps://3dtsi.com' },
    { id: 'proposal', name: 'Proposal Sent', subject: 'Proposal for {deal} — 3D Technology Services Inc.', body: 'Hi {contact},\n\nThank you for the opportunity. Please find attached our proposal for {deal}.\n\nKey highlights:\n• Scope: [describe scope]\n• Investment: ${value}\n• Timeline: [timeline]\n\nPlease don\'t hesitate to reach out if you have any questions. We look forward to working with {company}.\n\nBest regards,\n3D Technology Services Inc.\nhttps://3dtsi.com' },
    { id: 'thankyou', name: 'Thank You / Won', subject: 'Welcome aboard — {deal}', body: 'Hi {contact},\n\nThank you for choosing 3D Technology Services Inc. for {deal}! We are excited to partner with {company} and deliver exceptional results.\n\nOur team will be in touch shortly to kick things off.\n\nBest regards,\n3D Technology Services Inc.\nhttps://3dtsi.com' },
    { id: 'checkin', name: 'Check-In', subject: 'Checking in — {deal}', body: 'Hi {contact},\n\nJust checking in on {deal}. I wanted to see if there are any updates on your end or if there\'s anything 3D Technology Services Inc. can help with.\n\nLooking forward to your response.\n\nBest regards,\n3D Technology Services Inc.\nhttps://3dtsi.com' },
];

export default function EmailComposer({ deals, contacts, toast, refreshEmails }) {
    const [showCompose, setShowCompose] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [aiDrafting, setAiDrafting] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [draftSubject, setDraftSubject] = useState('');
    const [draftBody, setDraftBody] = useState('');
    const [draftContact, setDraftContact] = useState('');
    const [draftEmail, setDraftEmail] = useState('');
    const [draftDeal, setDraftDeal] = useState('');

    const fillTemplate = (template) => {
        const deal = deals.find(d => d.title === draftDeal) || {};
        const contact = contacts.find(c => c.name === draftContact) || {};
        const replacements = {
            '{contact}': draftContact || contact.name || '[Name]',
            '{company}': deal.company || contact.company || '[Company]',
            '{deal}': draftDeal || deal.title || '[Deal]',
            '{value}': deal.value ? `$${deal.value.toLocaleString()}` : '[Amount]',
        };
        let subject = template.subject;
        let body = template.body;
        Object.entries(replacements).forEach(([k, v]) => {
            subject = subject.replaceAll(k, v);
            body = body.replaceAll(k, v);
        });
        setDraftSubject(subject);
        setDraftBody(body);
        setSelectedTemplate(template.id);
    };

    const handleAIDraft = async () => {
        if (!aiPrompt.trim()) return;
        setAiDrafting(true);
        try {
            const deal = deals.find(d => d.title === draftDeal) || {};
            const contact = contacts.find(c => c.name === draftContact) || {};
            const result = await api.aiDraftEmail(aiPrompt, {
                contact: draftContact || contact.name,
                company: deal.company || contact.company,
                deal: draftDeal || deal.title,
                value: deal.value ? `$${deal.value.toLocaleString()}` : undefined,
                stage: deal.stage,
            });
            setDraftSubject(result.subject || `Re: ${draftDeal || 'Follow-up'}`);
            setDraftBody(result.body || '');
            toast('✨ AI draft generated!');
        } catch (err) {
            toast('AI drafting failed: ' + err.message, 'error');
        }
        setAiDrafting(false);
    };

    const handleSend = async () => {
        if (!draftSubject.trim()) return;

        // Open Outlook compose with pre-filled content (falls back to mailto:)
        const to = draftEmail || '';
        const subject = encodeURIComponent(draftSubject);
        const body = encodeURIComponent(draftBody);

        if (to.includes('@')) {
            // Outlook Web compose
            const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(to)}&subject=${subject}&body=${body}`;
            window.open(outlookUrl, '_blank');
        } else {
            // Fallback to mailto (opens desktop Outlook)
            window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_blank');
        }

        // Log the email in Pipeline3D for tracking
        const emailLog = {
            id: Date.now(),
            dealId: deals.find(d => d.title === draftDeal)?.id || null,
            dealTitle: draftDeal || '',
            dealStage: deals.find(d => d.title === draftDeal)?.stage || '',
            contact: draftContact,
            email: draftEmail,
            subject: draftSubject,
            type: selectedTemplate || 'custom',
            sentAt: new Date().toLocaleString(),
            opened: false, openedAt: null,
            clicked: false, clickedAt: null,
            engScore: 'pending', openProb: 50, clickProb: 25, tip: '',
        };
        try {
            await api.saveEmail(emailLog);
            await refreshEmails();
            toast('✅ Outlook opened — send from your inbox!');
            setShowCompose(false);
            resetForm();
        } catch (err) { toast(err.message, 'error'); }
    };

    const resetForm = () => {
        setDraftSubject(''); setDraftBody(''); setDraftContact('');
        setDraftEmail(''); setDraftDeal(''); setSelectedTemplate(null); setAiPrompt('');
    };

    return (
        <>
            <button className="btn btn-primary" onClick={() => { resetForm(); setShowCompose(true); }}>✉ Compose</button>

            {showCompose && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCompose(false)}>
                    <div className="modal modal-wide">
                        <div className="modal-header">
                            <h3>✉ Compose Email</h3>
                            <button className="modal-close" onClick={() => setShowCompose(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {/* Templates */}
                            <div style={{ marginBottom: 16 }}>
                                <div className="form-label">Quick Templates</div>
                                <div className="filter-bar">
                                    {TEMPLATES.map(t => (
                                        <button key={t.id} className={`filter-chip ${selectedTemplate === t.id ? 'active' : ''}`}
                                            onClick={() => fillTemplate(t)}>{t.name}</button>
                                    ))}
                                </div>
                            </div>

                            {/* AI Drafter */}
                            <div style={{ marginBottom: 16, background: 'var(--bg-surface)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                <div className="form-label">🤖 AI Email Drafter</div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input className="form-input" style={{ flex: 1 }} placeholder="Describe what you want to say…"
                                        value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAIDraft()} />
                                    <button className="btn btn-primary" onClick={handleAIDraft} disabled={aiDrafting}>
                                        {aiDrafting ? '⏳ Drafting…' : '✨ Draft'}
                                    </button>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">To (Contact)</label>
                                    <select className="form-select" value={draftContact} onChange={e => {
                                        setDraftContact(e.target.value);
                                        const c = contacts.find(x => x.name === e.target.value);
                                        if (c) setDraftEmail(c.email || '');
                                    }}>
                                        <option value="">Select contact…</option>
                                        {contacts.map(c => <option key={c.id} value={c.name}>{c.name} — {c.company || ''}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Related Deal</label>
                                    <select className="form-select" value={draftDeal} onChange={e => setDraftDeal(e.target.value)}>
                                        <option value="">Select deal…</option>
                                        {deals.map(d => <option key={d.id} value={d.title}>{d.title}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Subject</label>
                                <input className="form-input" value={draftSubject} onChange={e => setDraftSubject(e.target.value)} placeholder="Email subject" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Body</label>
                                <textarea className="form-textarea" style={{ minHeight: 180 }} value={draftBody}
                                    onChange={e => setDraftBody(e.target.value)} placeholder="Compose your email…" />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowCompose(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSend} disabled={!draftSubject.trim()}>📤 Send via Outlook</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
