import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HIDE_MESSAGE } from './../../slices/notificationSlice';

import { Alert, Typography, Snackbar } from '@mui/material';

const Notificacion = () => {
    const dispatch = useDispatch();
    const state = useSelector(state => state.notification_cementerio_qr.state);
    const message = useSelector(state => state.notification_cementerio_qr.message);
    const severity = useSelector(state => state.notification_cementerio_qr.severity);

    const handleCloseAlert = useCallback((event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        dispatch(HIDE_MESSAGE());
    }, [dispatch]);

    return (
        <Snackbar open={state} autoHideDuration={5000} onClose={handleCloseAlert}>
            <Alert onClose={handleCloseAlert} severity={severity} variant='filled' sx={{ width: '100%' }}>
                <Typography>{message}</Typography>
            </Alert>
        </Snackbar>
    )
};

export default Notificacion;