import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface AILog {
  type: 'info' | 'success' | 'error';
  message: string;
}

interface Transaction {
  id: string;
  flatId?: string;
  partyId?: string;
  totalAmount: number;
  bankAmount?: number;
  cashAmount?: number;
  transactionDate?: string | Date;
}

export default function AIAssistantPage() {
  const projects = useLiveQuery(() => db.projects.toArray(), []);
  const parties = useLiveQuery(() => db.parties.toArray(), []);
  const flats = useLiveQuery(() => db.flats.toArray(), []);
  const transactions = useLiveQuery(() => db.transactions.toArray(), []);

  const [aiInput, setAiInput] = useState('');
  const [suggestions, setSuggestions] = useState<{ display: string; value: string }[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const aiInputRef = useRef<HTMLInputElement>(null);
  const [logs, setLogs] = useState<AILog[]>([]);
  const [selectedContext, setSelectedContext] = useState<{
    type: 'flat' | 'party' | null;
    id?: string;
    name?: string;
  }>({
    type: null,
  });

  // --- Auto-suggestions ---
  useEffect(() => {
    if (!aiInput) return setSuggestions([]);

    const lower = aiInput.toLowerCase();

    // If user starts with "flat" or "party", detect what they’re searching
    const isFlatSearch = lower.startsWith('flat');
    const isPartySearch = lower.startsWith('party');

    // Extract the actual search term after "flat" or "party"
    const actualSearch = lower
      .replace(/^flat\s*/i, '')
      .replace(/^party\s*/i, '')
      .trim();

    let flatMatches: { display: string; value: string }[] = [];
    let partyMatches: { display: string; value: string }[] = [];

    // If starts with "flat", show all flats or filtered ones
    if (isFlatSearch) {
      flatMatches =
        flats
          ?.filter(f =>
            !actualSearch
              ? true // show all flats if nothing typed after 'flat'
              : f.flatNo.toLowerCase().includes(actualSearch)
          )
          .map(f => ({ display: `Flat : ${f.flatNo}`, value: f.flatNo })) || [];
    }

    // If starts with "party", show all parties or filtered ones
    if (isPartySearch) {
      partyMatches =
        parties
          ?.filter(p =>
            !actualSearch
              ? true // show all parties if nothing typed after 'party'
              : p.name.toLowerCase().includes(actualSearch)
          )
          .map(p => ({ display: `Party : ${p.name}`, value: p.name })) || [];
    }

    setSuggestions([...flatMatches, ...partyMatches].slice(0, 10));
    setHighlightedIndex(0);
  }, [aiInput, flats, parties]);

  const handleAIKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      applyAISuggestion(suggestions[highlightedIndex]);
    }
  };

  const applyAISuggestion = (s: { display: string; value: string }) => {
    setAiInput(s.value);
    setSuggestions([]);
  };

  // --- Date parser ---
  const parseFlexibleDate = (input: string) => {
    const parts = input.split('/');
    if (parts.length !== 3) return null;
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    return new Date(year, month, day);
  };

  // --- Execute Command ---
  const handleAIExecute = async () => {
    const input = aiInput.trim();
    if (!input.toLowerCase().startsWith('flat') && !input.toLowerCase().startsWith('party')) {
      setLogs(prev => [
        ...prev,
        { type: 'error', message: 'Start with "flat" or "party" command' },
      ]);
      return;
    }

    const flatMatch = input.match(/flat\s+([^\s,]+)/i);
    const partyMatch = input.match(/party\s+([^\s,]+)/i);
    const bankMatch = input.match(/bank\s+(\d+(\.\d+)?)/i);
    const cashMatch = input.match(/cash\s+(\d+(\.\d+)?)/i);
    const dateMatch = input.match(/date\s+([^\s,]+)/i);
    const completionMatch = input.match(/completion\s+(\d+)/i);

    // --- Flat Transaction ---
    if (flatMatch) {
      const flatNo = flatMatch[1].toUpperCase();
      const matchedFlats = flats?.filter(f => f.flatNo.toUpperCase() === flatNo) || [];
      if (!matchedFlats.length)
        return setLogs(prev => [...prev, { type: 'error', message: `Flat ${flatNo} not found` }]);

      let flat = matchedFlats[0];
      if (matchedFlats.length > 1) {
        const projectName = prompt(
          `Multiple projects found for flat ${flatNo}. Choose project: ${matchedFlats
            .map(f => projects?.find(p => p.id === f.projectId)?.name)
            .join(', ')}`
        );
        flat = matchedFlats.find(
          f => projects?.find(p => p.id === f.projectId)?.name === projectName
        );
      }

      if (!bankMatch && !cashMatch)
        return setLogs(prev => [
          ...prev,
          { type: 'error', message: 'Bank or Cash amount required' },
        ]);
      const bankAmount = bankMatch ? parseFloat(bankMatch[1]) : 0;
      const cashAmount = cashMatch ? parseFloat(cashMatch[1]) : 0;
      const totalAmount = bankAmount + cashAmount;
      if (totalAmount <= 0)
        return setLogs(prev => [
          ...prev,
          { type: 'error', message: 'Total amount must be greater than zero' },
        ]);

      const transactionDate = dateMatch ? parseFlexibleDate(dateMatch[1]) : new Date();
      if (!transactionDate)
        return setLogs(prev => [...prev, { type: 'error', message: 'Invalid transaction date' }]);

      await db.transactions.add({
        id: crypto.randomUUID(),
        projectId: flat.projectId,
        partyId: flat.partyId,
        flatId: flat.id,
        bankAmount,
        cashAmount,
        totalAmount,
        transactionDate: transactionDate,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      });

      setSelectedContext({ type: 'flat', id: flat.id, name: flat.flatNo });
      setLogs(prev => [
        ...prev,
        {
          type: 'success',
          message: `Transaction added for flat ${flatNo}. Bank: ${bankAmount}, Cash: ${cashAmount}, Date: ${transactionDate.toLocaleDateString()}`,
        },
      ]);
      setAiInput('');
      return;
    }

    // --- Party Lookup ---
    if (partyMatch) {
      const partyName = partyMatch[1];
      const matchedParties =
        parties?.filter(p => p.name.toLowerCase().includes(partyName.toLowerCase())) || [];
      if (!matchedParties.length)
        return setLogs(prev => [
          ...prev,
          { type: 'error', message: `Party ${partyName} not found` },
        ]);

      let party = matchedParties[0];
      //   if (matchedParties.length > 1) {
      //     const chosen = prompt(
      //       `Multiple matches found. Choose exact party: ${matchedParties.map(p => p.name).join(', ')}`
      //     );
      //     party = matchedParties.find(p => p.name === chosen);
      //   }

      const completionPercent = completionMatch ? parseInt(completionMatch[1], 10) : 100;

      const partyFlats = flats?.filter(f => f.partyId === party.id);
      const totalExpected =
        partyFlats?.reduce((sum, f) => sum + (f.amount || 0) * (completionPercent / 100), 0) || 0;
      const transactionsPaid = await db.transactions.where('partyId').equals(party.id).toArray();
      const totalReceived = transactionsPaid?.reduce((sum, t) => sum + t.totalAmount, 0) || 0;

      setSelectedContext({ type: 'party', id: party.id, name: party.name });
      setLogs(prev => [
        // ...prev,
        {
          type: 'info',
          message: `Party: ${party.name}, Completion: ${completionPercent}%, Expected: ${totalExpected}, Paid: ${totalReceived}, Balance: ${
            totalExpected - totalReceived
          }`,
        },
      ]);
      setAiInput('');
    }
  };

  const filteredTransactions: Transaction[] =
    selectedContext.type === 'party'
      ? transactions?.filter(t => t.partyId === selectedContext.id) || []
      : selectedContext.type === 'flat'
        ? transactions?.filter(t => t.flatId === selectedContext.id) || []
        : [];

  return (
    <section className="max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-2">AI Assistant</h1>
      <p className="text-sm text-slate-600 mb-4">
        Commands examples: <code>flat A1, bank 100, cash 50, date 1/11/24</code> or{' '}
        <code>party John, completion 80</code>
      </p>

      {/* Input Box */}
      <div className="relative">
        <input
          ref={aiInputRef}
          value={aiInput}
          onChange={e => setAiInput(e.target.value)}
          onKeyDown={handleAIKeyDown}
          placeholder="Type command..."
          className="p-3 rounded w-full border border-slate-300 shadow-sm"
        />
        {suggestions.length > 0 && (
          <ul className="absolute top-full left-0 right-0 bg-white border border-slate-300 rounded mt-1 max-h-48 overflow-y-auto z-50">
            {suggestions.map((s, i) => {
              const regex = new RegExp(`(${aiInput})`, 'i');
              const parts = s.display.split(regex);
              return (
                <li
                  key={i}
                  className={`px-3 py-2 cursor-pointer ${
                    i === highlightedIndex ? 'bg-slate-200' : ''
                  }`}
                  onClick={() => applyAISuggestion(s)}
                >
                  {parts.map((part, idx) =>
                    regex.test(part) ? (
                      <strong key={idx}>{part}</strong>
                    ) : (
                      <span key={idx}>{part}</span>
                    )
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button
        onClick={handleAIExecute}
        className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow hover:bg-indigo-700"
      >
        Execute
      </button>

      {/* Logs */}
      <div className="bg-white p-4 rounded-2xl shadow-lg space-y-2 max-h-72 overflow-y-auto">
        {logs.length === 0 && <p className="text-sm text-slate-500">No actions yet.</p>}
        {logs.map((log, idx) => (
          <div
            key={idx}
            className={`p-2 rounded ${
              log.type === 'success'
                ? 'bg-green-100 text-green-800'
                : log.type === 'error'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-slate-100 text-slate-800'
            }`}
          >
            {log.message}
          </div>
        ))}
      </div>

      {/* --- New Section: Contextual Transactions --- */}
      {selectedContext.type && (
        <div className="bg-slate-50 p-4 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-2">
            Transactions for{' '}
            {selectedContext.type === 'flat'
              ? `Flat ${selectedContext.name}`
              : `Party ${selectedContext.name}`}
          </h2>

          {filteredTransactions.length === 0 ? (
            <p className="text-slate-500 text-sm">No transactions found.</p>
          ) : (
            <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-right">Bank</th>
                  <th className="px-3 py-2 text-right">Cash</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(t => (
                  <tr key={t.id} className="border-t border-slate-200">
                    <td className="px-3 py-2">
                      {new Date(t.transactionDate || '').toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-3 py-2 text-right">{t.bankAmount || 0}</td>
                    <td className="px-3 py-2 text-right">{t.cashAmount || 0}</td>
                    <td className="px-3 py-2 text-right font-medium">{t.totalAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}
