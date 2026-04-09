'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Trash2, Trophy, Users, Calendar, Settings, Play, Edit2,
  ChevronDown, ChevronRight, X, Check, Zap, Medal, Grid3x3,
  BarChart3, RefreshCw, Lock, Unlock, Volume2, VolumeX
} from 'lucide-react';

// ============================================
// UTILITY FUNCTIONS
// ============================================

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const getAgeBracket = (age) => {
  if (age < 11) return 'Junior (U11)';
  if (age < 16) return 'Youth (11-15)';
  if (age < 35) return 'Adult (16-34)';
  return 'Masters (35+)';
};

const getWeightBracket = (weight) => {
  if (weight < 60) return 'Lightweight (<60kg)';
  if (weight < 75) return 'Middleweight (60-75kg)';
  if (weight < 90) return 'Heavyweight (75-90kg)';
  return 'Super Heavyweight (90kg+)';
};

const generateHeatPairings = (participants, eventType) => {
  if (eventType === 'three-legged-race') {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const pairs = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        pairs.push([shuffled[i], shuffled[i + 1]]);
      } else if (shuffled.length % 2 === 1) {
        pairs.push([shuffled[i]]);
      }
    }
    return pairs;
  }
  return participants.map(p => [p]);
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const createTournamentHeats = (participants, eventId, eventType, bracketSize = 4) => {
  if (participants.length === 0) return [];

  const numHeats = Math.ceil(participants.length / bracketSize);
  const heats = [];
  const shuffled = shuffleArray(participants);

  for (let i = 0; i < numHeats; i++) {
    const heatParticipants = shuffled.slice(
      i * bracketSize,
      Math.min((i + 1) * bracketSize, shuffled.length)
    );

    const pairings = generateHeatPairings(heatParticipants, eventType);

    heats.push({
      id: generateId(),
      eventId,
      stage: 'heats',
      number: i + 1,
      totalHeats: numHeats,
      pairings,
      results: {},
      qualifiers: [],
      locked: false,
    });
  }

  return heats;
};

const createNextStage = (qualifiers, eventId, stage, eventType) => {
  if (qualifiers.length <= 1) return [];

  const nextStage = stage === 'heats' ? 'quarter-finals' : stage === 'quarter-finals' ? 'semi-finals' : 'finals';
  const bracketSize = nextStage === 'finals' ? 3 : Math.min(4, qualifiers.length);
  const numHeats = Math.ceil(qualifiers.length / bracketSize);

  const heats = [];
  const shuffled = shuffleArray(qualifiers);

  for (let i = 0; i < numHeats; i++) {
    const heatParticipants = shuffled.slice(
      i * bracketSize,
      Math.min((i + 1) * bracketSize, shuffled.length)
    );

    const pairings = generateHeatPairings(heatParticipants, eventType);

    heats.push({
      id: generateId(),
      eventId,
      stage: nextStage,
      number: i + 1,
      totalHeats: numHeats,
      pairings,
      results: {},
      qualifiers: [],
      locked: false,
    });
  }

  return heats;
};

// ============================================
// MAIN APP
// ============================================

export default function SportsApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [events, setEvents] = useState([
    { id: 'EVT001', name: '100m Sprint', type: 'individual', eventType: 'sprint' },
    { id: 'EVT002', name: 'Long Jump', type: 'individual', eventType: 'long-jump' },
    { id: 'EVT003', name: 'Three-Legged Race', type: 'pairs', eventType: 'three-legged-race' },
    { id: 'EVT004', name: 'Egg & Spoon', type: 'individual', eventType: 'egg-spoon' },
  ]);
  const [heats, setHeats] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('sportsAppData');
    if (saved) {
      const data = JSON.parse(saved);
      setParticipants(data.participants || []);
      setHeats(data.heats || []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sportsAppData', JSON.stringify({ participants, heats }));
  }, [participants, heats]);

  const playSound = useCallback(() => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }, [soundEnabled]);

  const handleAddParticipant = (data) => {
    const newParticipant = {
      id: generateId(),
      ...data,
      results: {},
    };
    setParticipants([...participants, newParticipant]);
    playSound();
  };

  const handleDeleteParticipant = (id) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  const handleGenerateHeats = (eventId) => {
    const event = events.find(e => e.id === eventId);
    const eventParticipants = participants.filter(p => p.events.includes(eventId));

    if (eventParticipants.length === 0) {
      alert('No participants registered for this event');
      return;
    }

    const newHeats = createTournamentHeats(eventParticipants, eventId, event.eventType);
    setHeats([...heats.filter(h => h.eventId !== eventId), ...newHeats]);
    playSound();
  };

  const handleRecordResult = (heatId, participantId, place) => {
    setHeats(heats.map(h => {
      if (h.id === heatId) {
        return {
          ...h,
          results: { ...h.results, [participantId]: place },
        };
      }
      return h;
    }));
    playSound();
  };

  const handleAdvanceHeat = (heatId) => {
    const heat = heats.find(h => h.id === heatId);
    const resultEntries = Object.entries(heat.results);
    
    if (resultEntries.length === 0) {
      alert('Please record at least one result');
      return;
    }

    const sorted = resultEntries
      .sort(([, placeA], [, placeB]) => placeA - placeB)
      .slice(0, 3)
      .map(([pId]) => pId);

    const updatedHeat = {
      ...heat,
      qualifiers: sorted,
      locked: true,
    };

    setHeats(heats.map(h => (h.id === heatId ? updatedHeat : h)));

    const stageHeats = heats.filter(h => h.eventId === heat.eventId && h.stage === heat.stage);
    const allLocked = stageHeats.every(h => h.id === heatId || h.locked);

    if (allLocked && heat.stage !== 'finals') {
      const allQualifiers = stageHeats.reduce((acc, h) => {
        const heatQualifiers = h.id === heatId ? sorted : h.qualifiers;
        return [...acc, ...heatQualifiers];
      }, []);

      const nextStageHeats = createNextStage(allQualifiers, heat.eventId, heat.stage, events.find(e => e.id === heat.eventId).eventType);
      setHeats(prev => [...prev.filter(h => !(h.eventId === heat.eventId && h.stage === heat.stage)), ...nextStageHeats]);
    }

    playSound();
  };

  const leaderboard = useMemo(() => {
    const scores = {};
    
    participants.forEach(p => {
      scores[p.id] = { ...p, score: 0 };
    });

    heats.forEach(heat => {
      if (heat.stage === 'finals' && heat.locked) {
        Object.entries(heat.results).forEach(([pId, place]) => {
          if (scores[pId]) {
            const points = [10, 6, 4][place - 1] || 0;
            scores[pId].score += points;
          }
        });
      }
    });

    return Object.values(scores)
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [heats, participants]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white rounded-lg">
              <Trophy className="w-8 h-8 text-pink-600" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">SPORTS DAY 2026</h1>
              <p className="text-pink-100 text-sm font-semibold">Professional Event Manager</p>
            </div>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"
          >
            {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
        </div>
      </header>

      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'participants', label: 'Participants', icon: Users },
            { id: 'events', label: 'Events', icon: Calendar },
            { id: 'leaderboard', label: 'Leaderboard', icon: Medal },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedEvent(null);
                }}
                className={`flex items-center space-x-2 px-4 py-3 font-semibold text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                    : 'text-white/60 hover:text-white/90'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && <DashboardTab participants={participants} leaderboard={leaderboard} events={events} />}
        {activeTab === 'participants' && <ParticipantsTab participants={participants} onAdd={handleAddParticipant} onDelete={handleDeleteParticipant} events={events} />}
        {activeTab === 'events' && (
          selectedEvent ? (
            <EventDetailTab event={selectedEvent} heats={heats.filter(h => h.eventId === selectedEvent.id)} onBack={() => setSelectedEvent(null)} onGenerateHeats={() => handleGenerateHeats(selectedEvent.id)} participants={participants} onRecordResult={handleRecordResult} onAdvanceHeat={handleAdvanceHeat} />
          ) : (
            <EventsTab events={events} participants={participants} onSelectEvent={setSelectedEvent} />
          )
        )}
        {activeTab === 'leaderboard' && <LeaderboardTab leaderboard={leaderboard} />}
      </main>
    </div>
  );
}

function DashboardTab({ participants, leaderboard, events }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Participants" value={participants.length} color="from-blue-500 to-cyan-500" />
        <StatCard icon={Calendar} label="Events" value={events.length} color="from-purple-500 to-pink-500" />
        <StatCard icon={Trophy} label="Winners" value={leaderboard.length} color="from-yellow-500 to-orange-500" />
        <StatCard icon={Zap} label="Top Scorer" value={leaderboard[0]?.name || '-'} color="from-green-500 to-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Top 5 Scores</h3>
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((p, i) => (
              <div key={p.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {i + 1}
                  </div>
                  <span className="text-white font-semibold">{p.name}</span>
                </div>
                <span className="text-yellow-400 font-bold">{p.score} pts</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Total Registered</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">{participants.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">Events</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{events.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">Avg Age</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {participants.length > 0 ? Math.round(participants.reduce((a, p) => a + p.age, 0) / participants.length) : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-lg p-6 text-white shadow-lg transform hover:scale-105 transition-transform`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-semibold">{label}</p>
          <p className="text-3xl font-black mt-2">{value}</p>
        </div>
        <Icon className="w-12 h-12 opacity-20" />
      </div>
    </div>
  );
}

function ParticipantsTab({ participants, onAdd, onDelete, events }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sex: 'Male',
    age: '',
    weight: '',
    events: [],
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.age || !formData.weight || formData.events.length === 0) {
      alert('Please fill all fields and select at least one event');
      return;
    }
    onAdd({ ...formData, age: parseInt(formData.age), weight: parseFloat(formData.weight) });
    setFormData({ name: '', sex: 'Male', age: '', weight: '', events: [] });
    setShowForm(false);
  };

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Participants</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Add Participant</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="bg-white/10 border border-white/20 text-white placeholder-white/50 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <select
              value={formData.sex}
              onChange={e => setFormData({ ...formData, sex: e.target.value })}
              className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <input
              type="number"
              placeholder="Age"
              value={formData.age}
              onChange={e => setFormData({ ...formData, age: e.target.value })}
              className="bg-white/10 border border-white/20 text-white placeholder-white/50 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <input
              type="number"
              placeholder="Weight (kg)"
              step="0.1"
              value={formData.weight}
              onChange={e => setFormData({ ...formData, weight: e.target.value })}
              className="bg-white/10 border border-white/20 text-white placeholder-white/50 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="mb-4">
            <p className="text-white/70 text-sm font-semibold mb-2">Select Events:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {events.map(event => (
                <label key={event.id} className="flex items-center space-x-3 bg-white/5 p-3 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.events.includes(event.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setFormData({ ...formData, events: [...formData.events, event.id] });
                      } else {
                        setFormData({ ...formData, events: formData.events.filter(id => id !== event.id) });
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-white text-sm">{event.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
            >
              <Check className="w-5 h-5" />
              <span>Register</span>
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {participants.map(p => (
          <div key={p.id} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white font-bold text-lg">{p.name}</p>
                <p className="text-white/60 text-sm">{p.sex} • {p.age} yrs • {p.weight}kg</p>
              </div>
              <button
                onClick={() => onDelete(p.id)}
                className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="text-white/70 text-xs">
              <p className="font-semibold mb-1">Events:</p>
              <p>{p.events.length} selected</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventsTab({ events, participants, onSelectEvent }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {events.map(event => {
        const eventParticipants = participants.filter(p => p.events.includes(event.id));
        return (
          <button
            key={event.id}
            onClick={() => onSelectEvent(event)}
            className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-lg p-6 hover:from-white/20 hover:to-white/10 transition-all group"
          >
            <div className="text-white">
              <p className="text-2xl font-black mb-2">{event.name}</p>
              <p className="text-white/70 text-sm font-semibold mb-4">{event.type}</p>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-white/60 text-xs">Participants</p>
                <p className="text-2xl font-bold text-transparent bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text">{eventParticipants.length}</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-white/40 group-hover:text-white/70 transition-all mt-4" />
          </button>
        );
      })}
    </div>
  );
}

function EventDetailTab({ event, heats, onBack, onGenerateHeats, participants, onRecordResult, onAdvanceHeat }) {
  const eventParticipants = participants.filter(p => p.events.includes(event.id));
  const heatsGenerated = heats.length > 0;

  const stages = ['heats', 'quarter-finals', 'semi-finals', 'finals'];
  const stageHeats = stages.map(stage => heats.filter(h => h.stage === stage));

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-white/70 hover:text-white mb-6 transition-all"
      >
        <ChevronDown className="w-5 h-5 rotate-90" />
        <span className="font-semibold">Back</span>
      </button>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-black text-white">{event.name}</h2>
            <p className="text-white/70 text-sm">{eventParticipants.length} Participants</p>
          </div>
          {!heatsGenerated && (
            <button
              onClick={onGenerateHeats}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg font-bold flex items-center space-x-2 transition-all"
            >
              <Zap className="w-5 h-5" />
              <span>Generate Heats</span>
            </button>
          )}
        </div>
      </div>

      {!heatsGenerated ? (
        <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-lg p-12 text-center">
          <Trophy className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <p className="text-white text-lg font-semibold mb-2">No heats generated yet</p>
          <p className="text-white/60 mb-6">Click "Generate Heats" to create tournament brackets</p>
        </div>
      ) : (
        <div className="space-y-6">
          {stages.map((stage, stageIndex) => {
            const stageHeatsData = stageHeats[stageIndex];
            if (stageHeatsData.length === 0) return null;

            return (
              <div key={stage} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4 capitalize">{stage.replace('-', ' ')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stageHeatsData.map(heat => (
                    <HeatCard key={heat.id} heat={heat} participants={participants} onRecordResult={onRecordResult} onAdvanceHeat={onAdvanceHeat} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HeatCard({ heat, participants, onRecordResult, onAdvanceHeat }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-bold">Heat {heat.number}</h4>
        {heat.locked ? (
          <Lock className="w-5 h-5 text-green-400" />
        ) : (
          <Unlock className="w-5 h-5 text-yellow-400" />
        )}
      </div>

      <div className="space-y-2 mb-4">
        {heat.pairings.map((pairing, idx) => (
          <div key={idx} className="bg-white/5 rounded-lg p-3">
            {pairing.map(pId => {
              const p = participants.find(x => x.id === pId);
              const place = heat.results[pId];
              return (
                <div key={pId} className="flex items-center justify-between mb-2 last:mb-0">
                  <span className="text-white/80 text-sm">{p?.name}</span>
                  {!heat.locked && (
                    <select
                      value={place || ''}
                      onChange={e => onRecordResult(heat.id, pId, parseInt(e.target.value))}
                      className="bg-white/10 border border-white/20 text-white text-xs px-2 py-1 rounded"
                    >
                      <option value="">-</option>
                      <option value="1">1st</option>
                      <option value="2">2nd</option>
                      <option value="3">3rd</option>
                      <option value="4">4th</option>
                    </select>
                  )}
                  {place && <span className="text-yellow-400 font-bold text-sm">{place}st</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {!heat.locked && Object.keys(heat.results).length > 0 && (
        <button
          onClick={() => onAdvanceHeat(heat.id)}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center justify-center space-x-2"
        >
          <Play className="w-4 h-4" />
          <span>Advance</span>
        </button>
      )}
    </div>
  );
}

function LeaderboardTab({ leaderboard }) {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8">
      <h2 className="text-3xl font-black text-white mb-8">🏆 LEADERBOARD</h2>

      <div className="space-y-4">
        {leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <p className="text-white/60 text-lg">No scores yet. Complete finals to see results!</p>
          </div>
        ) : (
          leaderboard.map((p, idx) => (
            <div
              key={p.id}
              className={`flex items-center justify-between p-6 rounded-lg transition-all ${
                idx === 0
                  ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
                  : idx === 1
                  ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400/30'
                  : idx === 2
                  ? 'bg-gradient-to-r from-amber-600/20 to-yellow-600/20 border border-amber-600/30'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${
                    idx === 0
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-gray-900'
                      : idx === 1
                      ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900'
                      : idx === 2
                      ? 'bg-gradient-to-br from-amber-500 to-yellow-600 text-white'
                      : 'bg-gradient-to-br from-white/20 to-white/10 text-white'
                  }`}
                >
                  {idx + 1}
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{p.name}</p>
                  <p className="text-white/60 text-sm">{p.sex} • {p.age} yrs</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">{p.score}</p>
                <p className="text-white/60 text-sm font-semibold">POINTS</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
