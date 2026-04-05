import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Activity, HeartPulse, User, Clock, AlertCircle, ShieldAlert } from 'lucide-react';
import { triageEngine, type Question, type TriageResult, type UserContext } from '../lib/triageEngine';

export default function SymptomChecker() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [text, setText] = useState('');
  const [validationError, setValidationError] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [context, setContext] = useState<UserContext>({ age: '', gender: '', history: '' });
  const [result, setResult] = useState<TriageResult | null>(null);
  const [showAdvice, setShowAdvice] = useState(false);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const t = text.toLowerCase();
    const hasValidSymptom = t.match(/head|fever|temperature|hot|chest|heart|cough|breath|shortness|stomach|belly|abdomen|pain|dizz|lightheaded|faint|rash|skin|itch/i);
    if (!hasValidSymptom || text.trim().length < 4) {
      setValidationError('Please enter a valid symptom (e.g., headache, fever, chest pain)');
      return;
    }
    setValidationError('');
    const { keywords: kw, questions: qs } = triageEngine.analyzeText(text);
    setKeywords(kw);
    setQuestions(qs);
    if (qs.length > 0) { setStep(2); setQIndex(0); } else { setStep(3); }
  };

  const handleAnswer = (ans: string) => {
    const q = questions[qIndex];
    setAnswers(prev => ({ ...prev, [q.id]: ans }));
    if (qIndex < questions.length - 1) setQIndex(prev => prev + 1);
    else setStep(3);
  };

  const handleContextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = triageEngine.calculateResult(keywords, answers, context);
    setResult(res);
    setStep(4);
  };

  const reset = () => {
    setStep(1); setText(''); setValidationError(''); setKeywords([]);
    setQuestions([]); setAnswers({}); setContext({ age: '', gender: '', history: '' });
    setResult(null); setShowAdvice(false);
  };

  const urgencyColor = result?.color === 'red' ? 'border-red-500/40 bg-red-500/5' :
    result?.color === 'orange' ? 'border-orange-500/40 bg-orange-500/5' :
    result?.color === 'yellow' ? 'border-amber-500/40 bg-amber-500/5' :
    'border-emerald-500/40 bg-emerald-500/5';

  const dotColor = result?.color === 'red' ? 'bg-red-500' :
    result?.color === 'orange' ? 'bg-orange-500' :
    result?.color === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col pt-12 pb-24 items-center px-4">
      {/* Header */}
      <div className="text-center max-w-2xl w-full mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-5 shadow-[0_0_30px_rgba(0,212,255,0.15)]">
          <HeartPulse className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">AI Triage Assistant</h1>
        <p className="text-muted mt-2 text-base">Fast, intelligent symptom analysis guiding you to the right care.</p>

        {step < 4 && (
          <div className="flex justify-center gap-2 mt-6">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  step === i ? 'w-8 bg-primary shadow-[0_0_10px_rgba(0,212,255,0.5)]' :
                  step > i ? 'w-4 bg-primary/40' : 'w-4 bg-white/10'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="w-full max-w-2xl">
        <div className="glass-panel overflow-hidden">
          {/* STEP 1 */}
          {step === 1 && (
            <form onSubmit={handleTextSubmit} className="p-8">
              <h2 className="text-xl font-bold text-white mb-1">What brings you here today?</h2>
              <p className="text-muted mb-6 text-sm">Please describe your symptoms in detail.</p>

              <textarea
                autoFocus
                value={text}
                onChange={e => { setText(e.target.value); if (validationError) setValidationError(''); }}
                placeholder="Example: I've been experiencing a severe headache with fever..."
                className="premium-input min-h-[140px] resize-none"
              />
              {validationError && (
                <p className="text-red-400 text-sm font-medium mt-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />{validationError}
                </p>
              )}

              <button
                type="submit"
                disabled={text.trim().length < 4}
                className="glow-button mt-6 w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && questions.length > 0 && (
            <div className="p-8">
              <div className="mb-2 text-xs font-bold text-primary uppercase tracking-widest">
                Question {qIndex + 1} of {questions.length}
              </div>
              <h2 className="text-2xl font-bold text-white mb-8 leading-snug">{questions[qIndex].text}</h2>

              <div className="space-y-3">
                {questions[qIndex].options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all font-medium text-muted text-base group"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <form onSubmit={handleContextSubmit} className="p-8">
              <h2 className="text-2xl font-bold text-white mb-1">Just a few more details</h2>
              <p className="text-muted mb-8 text-sm">This helps calculate the correct urgency level.</p>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Age</label>
                    <input type="number" required value={context.age} onChange={e => setContext({ ...context, age: e.target.value })} className="premium-input" placeholder="e.g. 34" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Gender</label>
                    <select required value={context.gender} onChange={e => setContext({ ...context, gender: e.target.value })} className="premium-input [&>option]:text-slate-900">
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">Existing Conditions <span className="text-muted/60">(Optional)</span></label>
                  <input type="text" value={context.history} onChange={e => setContext({ ...context, history: e.target.value })} className="premium-input" placeholder="e.g. Diabetes, Hypertension" />
                </div>
              </div>

              <button type="submit" className="glow-button mt-8 w-full py-4 text-base flex items-center justify-center gap-2">
                Calculate Result <Activity className="w-5 h-5" />
              </button>
            </form>
          )}

          {/* STEP 4: RESULT */}
          {step === 4 && result && (
            <div>
              {/* Patient Pills */}
              <div className="px-6 pt-6 pb-4 border-b border-white/10 flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-muted">
                  <User className="w-3.5 h-3.5" /> {context.age} y/o {context.gender}
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-muted">
                  <Activity className="w-3.5 h-3.5 text-primary" /> {result.parsedContext.symptom}
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-muted">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> {result.parsedContext.duration}
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-muted">
                  Severity: {result.parsedContext.severity}
                </div>
                {context.history && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-muted">
                    Hx: {context.history}
                  </div>
                )}
              </div>

              <div className="p-6">
                {/* Triage Banner */}
                <div className={`flex items-center gap-4 p-5 mb-6 rounded-xl border ${urgencyColor}`}>
                  <div className={`w-4 h-4 rounded-full shrink-0 shadow-lg ${dotColor}`} />
                  <div>
                    <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Recommended Action</div>
                    <div className="text-lg font-bold text-white">{result.action.text}</div>
                  </div>
                </div>

                {/* Alert */}
                {result.alert && (
                  <div className="flex items-start gap-3 p-4 mb-6 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400 text-sm font-medium leading-relaxed">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>{result.alert}</div>
                  </div>
                )}

                {/* Possible Conditions */}
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-4 pb-2 border-b border-white/10">Possible Conditions</h3>
                  <div className="space-y-4">
                    {result.conditions.map((c, i) => (
                      <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold text-white">{c.name}</div>
                          <div className={`text-xs font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${
                            c.confidence === 'Most likely' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            c.confidence === 'Possible' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-white/5 text-muted border-white/10'
                          }`}>
                            {c.confidence}
                          </div>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5 mb-3 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${c.confidence === 'Most likely' ? 'bg-red-500' : c.confidence === 'Possible' ? 'bg-amber-400' : 'bg-white/30'}`}
                            style={{ width: `${c.confidenceValue}%` }}
                          />
                        </div>
                        <p className="text-muted text-sm leading-relaxed">{c.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Red Flags */}
                {result.redFlags.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-4 pb-2 border-b border-white/10">Seek Immediate Care If You Notice</h3>
                    <ul className="space-y-2">
                      {result.redFlags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-muted font-medium">
                          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Home Care */}
                {result.homeCare.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-4 pb-2 border-b border-white/10">Home Care Guidance</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.homeCare.map((s, i) => (
                        <div key={i} className="p-3 rounded-xl border border-primary/10 bg-primary/5 flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">{i + 1}</div>
                          <div className="text-sm text-muted leading-snug">{s}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 py-2">
                  <button
                    onClick={() => result.action.type === 'maps' ? window.open('https://maps.google.com/?q=nearest+hospital', '_blank') : navigate('/appointments')}
                    className="glow-button w-full py-4 text-center text-base"
                  >
                    {result.action.type === 'maps' ? 'Find Nearest Hospital' : 'Book a Doctor Appointment'}
                  </button>
                  <button
                    onClick={() => setShowAdvice(!showAdvice)}
                    className="w-full py-4 glass-panel text-muted hover:text-white font-bold rounded-xl transition text-center text-base"
                  >
                    {showAdvice ? 'Hide Summary' : 'What to Tell Your Doctor'}
                  </button>
                </div>

                {showAdvice && (
                  <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-muted leading-relaxed">
                    <p className="mb-3 text-muted/70">Read this summary to your doctor or at the front desk:</p>
                    <ul className="list-disc pl-5 space-y-1.5 marker:text-primary">
                      <li>I am experiencing <strong className="text-white">{result.parsedContext.symptom.toLowerCase()}</strong>.</li>
                      <li>It has been going on for <strong className="text-white">{result.parsedContext.duration.toLowerCase()}</strong> and feels <strong className="text-white">{result.parsedContext.severity.toLowerCase()}</strong>.</li>
                      {context.history && <li>My medical history includes: <strong className="text-white">{context.history}</strong>.</li>}
                    </ul>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="mt-8 text-center border-t border-white/10 pt-6">
                  <p className="text-xs text-muted/50 max-w-sm mx-auto">This is not a medical diagnosis. This is a triage tool for guidance only. For medical emergencies, always call emergency services immediately.</p>
                  <button onClick={reset} className="text-sm font-bold text-primary hover:text-white transition tracking-wide mt-4">
                    START OVER
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
