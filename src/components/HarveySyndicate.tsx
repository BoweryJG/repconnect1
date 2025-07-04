import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  Avatar,
  LinearProgress,
  Tooltip,
  Badge,
  Divider,
  CircularProgress,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  EmojiEvents,
  Gavel,
  LocalFireDepartment,
  Mic,
  MicOff,
  Visibility,
  TrendingUp,
  Warning,
  Psychology,
  Nightlight,
  VolumeUp,
  Settings,
  Chat,
  PowerSettingsNew,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { harveyService } from '../services/harveyService';
import { harveyWebRTC } from '../services/harveyWebRTC';
import { HarveyControlPanel } from './HarveyControlPanel';

interface HarveyMetrics {
  reputationPoints: number;
  currentStreak: number;
  totalCalls: number;
  closingRate: number;
  harveyStatus: 'rookie' | 'closer' | 'partner' | 'legend';
  dailyVerdict: {
    rating: number;
    message: string;
    timestamp: Date;
  } | null;
  activeTrials: any[];
}

export const HarveySyndicate: React.FC = () => {
  const [metrics, setMetrics] = useState<HarveyMetrics>({
    reputationPoints: 0,
    currentStreak: 0,
    totalCalls: 0,
    closingRate: 0,
    harveyStatus: 'rookie',
    dailyVerdict: null,
    activeTrials: [],
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [hotLeads, setHotLeads] = useState<any[]>([]);
  const [isAfterDark, setIsAfterDark] = useState(false);
  const [showControlPanel, setShowControlPanel] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Initialize Harvey connection
    initializeHarvey();
    
    // Check if it's after dark (8 PM - 5 AM)
    const checkAfterDark = () => {
      const hour = new Date().getHours();
      setIsAfterDark(hour >= 20 || hour < 5);
    };
    
    checkAfterDark();
    const interval = setInterval(checkAfterDark, 60000); // Check every minute
    
    return () => {
      clearInterval(interval);
      harveyWebRTC.disconnect();
    };
  }, []);

  const initializeHarvey = async () => {
    try {
      // Initialize WebRTC connection
      await harveyWebRTC.connect({
        userId: 'demo', // Using demo user for now
        onConnectionChange: (connected) => setIsConnected(connected),
        onAudioReceived: (audioData) => {
          // Play Harvey's voice
          if (audioRef.current && !isMuted) {
            audioRef.current.src = audioData;
            audioRef.current.play();
          }
        },
      });
      
      // Load initial metrics
      const data = await harveyService.getMetrics();
      setMetrics(data.metrics);
      setLeaderboard(data.leaderboard);
      
      // Get daily verdict if not already received
      if (!data.metrics.dailyVerdict) {
        const verdict = await harveyService.getDailyVerdict();
        setMetrics(prev => ({ ...prev, dailyVerdict: verdict }));
      }
      
      // Subscribe to real-time updates
      harveyService.subscribeToUpdates((update) => {
        if (update.type === 'metrics') {
          setMetrics(update.data);
        } else if (update.type === 'leaderboard') {
          setLeaderboard(update.data);
        } else if (update.type === 'hotLead') {
          setHotLeads(prev => [update.data, ...prev].slice(0, 5));
        }
      });
      
    } catch (error) {
      console.error('Failed to initialize Harvey:', error);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    harveyWebRTC.setMuted(!isMuted);
  };

  const startListening = async () => {
    setIsListening(true);
    await harveyWebRTC.startListening();
  };

  const stopListening = () => {
    setIsListening(false);
    harveyWebRTC.stopListening();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'legend': return '#FFD700';
      case 'partner': return '#EC4899';
      case 'closer': return '#6366F1';
      default: return '#64748B';
    }
  };

  const getVerdictColor = (rating: number) => {
    if (rating >= 8) return '#10B981';
    if (rating >= 5) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, 
          rgba(10, 10, 10, 0.95) 0%, 
          rgba(20, 20, 20, 0.9) 50%, 
          rgba(10, 10, 10, 0.95) 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background effect */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isAfterDark
            ? 'radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                background: `linear-gradient(135deg, #FFD700 0%, ${getStatusColor(metrics.harveyStatus)} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              The Harvey Syndicate
            </Typography>
            <Typography variant="h5" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              "I don't have dreams. I have goals."
            </Typography>
            
            {/* Connection Status */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: isConnected ? '#10B981' : '#EF4444',
                    width: 12,
                    height: 12,
                    border: '2px solid #0A0A0A',
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    background: 'linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)',
                    border: `3px solid ${getStatusColor(metrics.harveyStatus)}`,
                  }}
                >
                  <Gavel sx={{ fontSize: 30, color: getStatusColor(metrics.harveyStatus) }} />
                </Avatar>
              </Badge>
              
              <Box>
                <Typography variant="h6" sx={{ color: getStatusColor(metrics.harveyStatus) }}>
                  {metrics.harveyStatus.toUpperCase()} STATUS
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {isConnected ? 'Harvey is watching' : 'Reconnecting...'}
                </Typography>
              </Box>
              
              {/* Voice Controls */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  onClick={toggleMute}
                  sx={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    '&:hover': { background: 'rgba(255, 255, 255, 0.1)' },
                  }}
                >
                  {isMuted ? <MicOff /> : <Mic />}
                </IconButton>
                <IconButton
                  onClick={isListening ? stopListening : startListening}
                  sx={{
                    background: isListening ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    '&:hover': { background: isListening ? 'rgba(236, 72, 153, 0.3)' : 'rgba(255, 255, 255, 0.1)' },
                  }}
                >
                  <VolumeUp sx={{ color: isListening ? '#EC4899' : 'inherit' }} />
                </IconButton>
              </Box>
              
              {isAfterDark && (
                <Chip
                  icon={<Nightlight />}
                  label="AFTER DARK MODE"
                  sx={{
                    ml: 2,
                    background: 'linear-gradient(135deg, #EC4899 0%, #6366F1 100%)',
                    fontWeight: 700,
                  }}
                />
              )}
            </Box>
          </Box>
        </motion.div>

        {/* Daily Verdict Card */}
        {metrics.dailyVerdict && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card
              sx={{
                mb: 4,
                background: `linear-gradient(135deg, 
                  rgba(26, 26, 26, 0.95) 0%, 
                  rgba(30, 30, 30, 0.9) 100%)`,
                border: `2px solid ${getVerdictColor(metrics.dailyVerdict.rating)}`,
                boxShadow: `0 0 40px ${getVerdictColor(metrics.dailyVerdict.rating)}40`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Today's Verdict
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h3" sx={{ color: getVerdictColor(metrics.dailyVerdict.rating) }}>
                      {metrics.dailyVerdict.rating}/10
                    </Typography>
                    <EmojiEvents sx={{ fontSize: 40, color: getVerdictColor(metrics.dailyVerdict.rating) }} />
                  </Box>
                </Box>
                <Typography variant="h6" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  "{metrics.dailyVerdict.message}"
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', mt: 1, display: 'block' }}>
                  — Harvey Specter, {new Date(metrics.dailyVerdict.timestamp).toLocaleTimeString()}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Dashboard Grid */}
        <Grid container spacing={3}>
          {/* Reputation & Stats */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Paper
                sx={{
                  p: 3,
                  background: 'rgba(26, 26, 26, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  height: '100%',
                }}
              >
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                  Your Standing
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    Reputation Points
                  </Typography>
                  <Typography variant="h3" sx={{ color: '#FFD700', fontWeight: 900 }}>
                    {metrics.reputationPoints.toLocaleString()}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(metrics.reputationPoints % 1000) / 10}
                    sx={{
                      mt: 1,
                      height: 8,
                      borderRadius: 4,
                      background: 'rgba(255, 215, 0, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Current Streak
                      </Typography>
                      <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {metrics.currentStreak}
                        <LocalFireDepartment sx={{ color: '#EF4444' }} />
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Closing Rate
                      </Typography>
                      <Typography variant="h5">
                        {(metrics.closingRate * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{
                      background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
                      py: 1.5,
                      fontWeight: 700,
                    }}
                  >
                    Challenge Harvey
                  </Button>
                </Box>
              </Paper>
            </motion.div>
          </Grid>

          {/* Leaderboard */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Paper
                sx={{
                  p: 3,
                  background: 'rgba(26, 26, 26, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  height: '100%',
                }}
              >
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                  The Elite
                </Typography>
                
                {leaderboard.map((rep, index) => (
                  <Box
                    key={rep.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1.5,
                      borderBottom: index < leaderboard.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'text.secondary',
                          fontWeight: 700,
                        }}
                      >
                        #{index + 1}
                      </Typography>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {rep.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {rep.status}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="h6" sx={{ color: '#FFD700' }}>
                      {rep.points.toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </motion.div>
          </Grid>

          {/* Hot Leads */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Paper
                sx={{
                  p: 3,
                  background: 'rgba(26, 26, 26, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  height: '100%',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Harvey's Hit List
                  </Typography>
                  <Chip
                    label="LIVE"
                    size="small"
                    sx={{
                      background: '#EF4444',
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': { opacity: 1 },
                        '50%': { opacity: 0.5 },
                        '100%': { opacity: 1 },
                      },
                    }}
                  />
                </Box>
                
                {hotLeads.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No hot leads right now. Harvey is hunting...
                    </Typography>
                  </Box>
                ) : (
                  hotLeads.map((lead, index) => (
                    <Box
                      key={lead.id}
                      sx={{
                        p: 2,
                        mb: 2,
                        background: 'rgba(236, 72, 153, 0.1)',
                        border: '1px solid rgba(236, 72, 153, 0.3)',
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        '&:hover': {
                          background: 'rgba(236, 72, 153, 0.2)',
                          transform: 'translateX(10px)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {lead.company}
                        </Typography>
                        <Chip
                          label={`${lead.multiplier}x`}
                          size="small"
                          sx={{ background: 'linear-gradient(135deg, #EC4899 0%, #6366F1 100%)' }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {lead.industry} • {lead.size}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <TrendingUp sx={{ fontSize: 16, color: '#10B981' }} />
                        <Typography variant="caption" sx={{ color: '#10B981' }}>
                          {lead.readyScore}% ready to buy
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Paper>
            </motion.div>
          </Grid>
        </Grid>

        {/* Active Trials Section */}
        {metrics.activeTrials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
                Active Trials
              </Typography>
              <Grid container spacing={3}>
                {metrics.activeTrials.map((trial) => (
                  <Grid item xs={12} md={6} key={trial.id}>
                    <Card
                      sx={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 10px 40px rgba(99, 102, 241, 0.3)',
                        },
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {trial.name}
                          </Typography>
                          <Chip
                            label={trial.difficulty}
                            size="small"
                            sx={{
                              background: trial.difficulty === 'EXTREME' ? '#EF4444' : '#F59E0B',
                            }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                          {trial.description}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {trial.participants} competing
                          </Typography>
                          <Button
                            variant="contained"
                            size="small"
                            sx={{
                              background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
                            }}
                          >
                            Enter Arena
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </motion.div>
        )}
      </Box>

      {/* Hidden audio element for Harvey's voice */}
      <audio ref={audioRef} style={{ display: 'none' }} />
      
      {/* Harvey Control Panel Dialog */}
      <HarveyControlPanel 
        open={showControlPanel} 
        onClose={() => setShowControlPanel(false)} 
      />
      
      {/* Floating Action Button for Settings */}
      <SpeedDial
        ariaLabel="Harvey settings"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon openIcon={<Settings />} />}
      >
        <SpeedDialAction
          icon={<Settings />}
          tooltipTitle="Harvey Settings"
          onClick={() => setShowControlPanel(true)}
        />
        <SpeedDialAction
          icon={<Chat />}
          tooltipTitle="Chat with Harvey"
          onClick={() => setShowControlPanel(true)}
        />
        <SpeedDialAction
          icon={<PowerSettingsNew />}
          tooltipTitle="Toggle Harvey"
          onClick={() => {
            const harveyEnabled = localStorage.getItem('harveyModes') 
              ? JSON.parse(localStorage.getItem('harveyModes')!).enabled 
              : true;
            const newModes = { 
              ...JSON.parse(localStorage.getItem('harveyModes') || '{}'), 
              enabled: !harveyEnabled 
            };
            localStorage.setItem('harveyModes', JSON.stringify(newModes));
            window.location.reload(); // Quick toggle requires reload
          }}
        />
      </SpeedDial>
    </Box>
  );
};