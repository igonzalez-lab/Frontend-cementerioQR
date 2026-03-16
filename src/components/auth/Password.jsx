import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { Alert, Box, Button, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, TextField, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Visibility, VisibilityOff, Emergency, Close } from '@mui/icons-material';

import { SHOW_ERROR_MESSAGE, SHOW_SUCCESS_MESSAGE } from '../../slices/notificationSlice';
import { encryptMessage } from '../../helpers/helpers';

const Password = ({ dialogPassword, setDialogPassword }) => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordRepeat, setPasswordRepeat] = useState('');

    const [openDanger, setOpenDanger] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordRepeat, setShowPasswordRepeat] = useState(false);

    const handlePassword = useCallback(async () => {
        try {
            if (username === '') {
                throw new Error('El Usuario es obligatorio');
            }

            if (password === '' || passwordRepeat === '') {
                throw new Error('La Contraseña es Obligatoria');
            } else if (password !== passwordRepeat) {
                throw new Error('Verifique las Contraseñas');
            }

            const requestHeader = new Headers();
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                username: encryptMessage(username.trim()),
                password: encryptMessage(password.trim()),
            });

            const requestOptions = {
                method: 'PUT',
                body: requestBody,
                headers: requestHeader
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/auth/password-user`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setUsername('');
            setPassword('');
            setDialogPassword(false);
            dispatch(SHOW_SUCCESS_MESSAGE('Clave cambiada correctamente'));
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [username, password, passwordRepeat, dispatch, setUsername, setPassword, setDialogPassword]);

    return (
        <Dialog onClose={() => setDialogPassword(false)} open={dialogPassword} maxWidth='md' fullScreen={fullScreen}>
            <DialogTitle>Olvide mi contraseña</DialogTitle>
            <DialogContent>
                <Collapse in={openDanger}>
                    <Alert
                        action={
                            <Tooltip title='Cerrar alerta'>
                                <IconButton color='inherit' size='small' onClick={() => setOpenDanger(false)}>
                                    <Close fontSize='inherit' />
                                </IconButton>
                            </Tooltip>
                        }
                        severity='error'
                        sx={{ mb: 2 }}
                    >
                        <Box display={'flex'} alignItems={'center'}>
                            <Emergency color='error' fontSize='small' sx={{ mr: 1 }} />
                            Datos obligatorios
                        </Box>
                    </Alert>
                </Collapse>

                <TextField fullWidth label={<Box display={'flex'} alignItems={'center'}>
                    <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                    Usuario
                </Box>} variant='outlined' type='text' value={username} onChange={(e) => setUsername(e.target.value)} sx={{ mt: 1, mb: 2 }} />

                <TextField fullWidth label={<Box display={'flex'} alignItems={'center'}>
                    <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                    Contraseña
                </Box>} variant='outlined' type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} slotProps={{
                    input: {
                        endAdornment: (
                            <InputAdornment position='end'>
                                <Tooltip title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        ),
                    }
                }} />

                <TextField fullWidth label={<Box display={'flex'} alignItems={'center'}>
                    <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                    Repetir Contraseña
                </Box>} variant='outlined' type={showPasswordRepeat ? 'text' : 'password'} value={passwordRepeat} onChange={(e) => setPasswordRepeat(e.target.value)} sx={{ mb: 2 }} slotProps={{
                    input: {
                        endAdornment: (
                            <InputAdornment position='end'>
                                <Tooltip title={showPasswordRepeat ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                                    <IconButton onClick={() => setShowPasswordRepeat(!showPasswordRepeat)}>
                                        {showPasswordRepeat ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        ),
                    }
                }} />
            </DialogContent>
            <DialogActions>
                <Button variant='text' color='primary' onClick={handlePassword}>
                    <Typography variant='button'>Confirmar</Typography>
                </Button>
                <Button variant='text' color='inherit' onClick={() => setDialogPassword(false)}>
                    <Typography variant='button'>Cerrar</Typography>
                </Button>
            </DialogActions>
        </Dialog>
    )
};

export default Password;
