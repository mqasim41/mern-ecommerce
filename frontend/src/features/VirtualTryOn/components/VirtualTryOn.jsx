import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, IconButton, CircularProgress, Button } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CloseIcon from '@mui/icons-material/Close';

const VirtualTryOn = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isActive, setIsActive]   = useState(false);
  const [error, setError]         = useState('');
  const [frameSrc, setFrameSrc]   = useState(null);

  const ws = useRef(null);

  const sendInitialRequest = useCallback(() => {
    ws.current.send(JSON.stringify({
      type: 'INIT_REQUEST',
      payload: { productId, userId: localStorage.getItem('userId') }
    }));
  }, [productId]);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8080/ws/video');

    ws.current.onopen = () => {
      console.log('Connected to try-on server');
      setError('');            // clear any previous error
      setIsLoading(false);
      sendInitialRequest();
    };

    ws.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'INIT_RESPONSE':
          setIsActive(true);
          return;

        case 'FRAME_PROCESSED':
          setFrameSrc(`data:image/jpeg;base64,${msg.payload.image}`);
          return;

        case 'ERROR':
          setError(msg.message);
          setIsLoading(false);
          return;

        default:
          console.warn('Unknown WS type:', msg.type);
      }
    };

    ws.current.onerror = (e) => {
      console.error('WebSocket error:', e);
      setError('Connection failed. Please try again later.');
      setIsLoading(false);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
      setIsActive(false);
    };

    return () => ws.current?.close();
  }, [sendInitialRequest]);

  const handleClose = () => navigate(-1);

  if (error) {
    return (
      <Box sx={styles.container}>
        <Typography color="error">{error}</Typography>
        <Button onClick={handleClose}>Go Back</Button>
      </Box>
    );
  }

  return (
    <Box sx={styles.container}>
      <IconButton onClick={handleClose} sx={styles.closeButton}>
        <CloseIcon />
      </IconButton>

      <Typography variant="h4" gutterBottom>
        Virtual Try‑On
      </Typography>

      {isLoading ? (
        <Box sx={styles.loadingContainer}>
          <CircularProgress size={60} />
          <Typography mt={2}>Initializing virtual try‑on session…</Typography>
        </Box>
      ) : (
        <Box sx={styles.previewContainer}>
          {frameSrc ? (
            <img
              src={frameSrc}
              alt="Live feed"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Box sx={styles.cameraPreview}>
              <CameraAltIcon sx={styles.cameraIcon} />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

const styles = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    p: 4,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  closeButton: { position: 'absolute', top: 16, right: 16 },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 },
  previewContainer: { width: '100%', maxWidth: 800, textAlign: 'center' },
  cameraPreview: {
    position: 'relative',
    width: '100%',
    height: 500,
    backgroundColor: 'black',
    borderRadius: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cameraIcon: { fontSize: 80, color: 'white' }
};

export default VirtualTryOn;
