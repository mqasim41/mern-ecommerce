import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, IconButton, CircularProgress, Stack, Button } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CloseIcon from '@mui/icons-material/Close';

const VirtualTryOn = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isActive, setIsActive] = useState(false);
  const ws = useRef(null);

  const sendInitialRequest = useCallback(() => {
    const message = {
      type: 'INIT_REQUEST',
      payload: {
        productId,
        userId: localStorage.getItem('userId'),
      },
    };
    ws.current.send(JSON.stringify(message));
  }, [productId]);

  useEffect(() => {
    // Connect to WebSocket server
    ws.current = new WebSocket('ws://localhost:8080/virtual-try-on');

    ws.current.onopen = () => {
      console.log('Connected to try-on server');
      setIsLoading(false);
      sendInitialRequest();
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleServerMessage(data);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection failed. Please try again later.');
      setIsLoading(false);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
      setIsActive(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [sendInitialRequest]); // Added sendInitialRequest to dependency array

  const handleServerMessage = (data) => {
    switch (data.type) {
      case 'INIT_RESPONSE':
        setIsActive(true);
        break;
      case 'FRAME_PROCESSED':
        // Handle frame updates (would typically update AR view)
        break;
      case 'ERROR':
        setError(data.message);
        setIsLoading(false);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const handleCapture = () => {
    // This would typically capture webcam frame
    const message = {
      type: 'CAPTURE_FRAME',
      payload: { /* frame data */ },
    };
    ws.current.send(JSON.stringify(message));
  };

  const handleClose = () => {
    navigate(-1);
  };

  if (error) {
    return (
      <Box sx={styles.container}>
        <Typography color="error" variant="h6">{error}</Typography>
        <Button variant="contained" onClick={handleClose}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={styles.container}>
      <IconButton sx={styles.closeButton} onClick={handleClose}>
        <CloseIcon />
      </IconButton>

      <Typography variant="h4" gutterBottom>
        Virtual Try-On
      </Typography>

      {isLoading ? (
        <Box sx={styles.loadingContainer}>
          <CircularProgress size={60} />
          <Typography variant="body1" mt={2}>
            Initializing virtual try-on session...
          </Typography>
        </Box>
      ) : (
        <Box sx={styles.previewContainer}>
          {/* Webcam preview would go here */}
          <Box sx={styles.cameraPreview}>
            <CameraAltIcon sx={styles.cameraIcon} />
          </Box>

          <Stack direction="row" spacing={2} mt={3}>
            <Button
              variant="contained"
              startIcon={<CameraAltIcon />}
              onClick={handleCapture}
              disabled={!isActive}
            >
              Try On Glasses
            </Button>
          </Stack>
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
    backgroundColor: '#f5f5f5',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    mt: 8,
  },
  previewContainer: {
    width: '100%',
    maxWidth: 800,
    textAlign: 'center',
  },
  cameraPreview: {
    position: 'relative',
    width: '100%',
    height: '500px',
    backgroundColor: 'black',
    borderRadius: 2,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 80,
    color: 'white',
  },
};

export default VirtualTryOn;