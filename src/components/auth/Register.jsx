import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { Alert, Box, Button, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, TextField, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Visibility, VisibilityOff, Emergency, Close } from '@mui/icons-material';

import { SHOW_ERROR_MESSAGE, SHOW_SUCCESS_MESSAGE } from '../../slices/notificationSlice';
import { encryptMessage } from '../../helpers/helpers';
import { SET_USER_DATA } from '../../slices/userSlice';

const Register = ({ dialogRegister, setDialogRegister }) => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    const [openDanger, setOpenDanger] = useState(true);
    const [openWarning, setOpenWarning] = useState(true);
    const [openInformation, setOpenInformation] = useState(true);

    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordRepeat, setPasswordRepeat] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordRepeat, setShowPasswordRepeat] = useState(false);

    const handleRegister = useCallback(async () => {
        try {
            if (name === '') {
                throw new Error('El Nombre es obligatorio');
            }

            if (surname === '') {
                throw new Error('El Apellido es obligatorio');
            }

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
                name: encryptMessage(name.trim()),
                surname: encryptMessage(surname.trim()),
                username: encryptMessage(username.trim()),
                password: encryptMessage(password.trim()),
            });

            const requestOptions = {
                method: 'POST',
                body: requestBody,
                headers: requestHeader
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/auth/create-admin`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setName('');
            setSurname('');
            setUsername('');
            setPassword('');
            setDialogRegister(false);

            dispatch(SET_USER_DATA(encryptMessage(responseJson.message)));
            dispatch(SHOW_SUCCESS_MESSAGE('Usuario Administrador Registrado con Éxito'));
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [name, surname, username, password, passwordRepeat, dispatch, setName, setSurname, setUsername, setPassword, setDialogRegister]);

    return (
        <Dialog onClose={() => setDialogRegister(false)} open={dialogRegister} maxWidth='md' fullScreen={fullScreen}>
            <DialogTitle>Registrarme</DialogTitle>
            <DialogContent>
                <Collapse in={openInformation}>
                    <Alert
                        action={
                            <Tooltip title='Cerrar alerta'>
                                <IconButton color='inherit' size='small' onClick={() => setOpenInformation(false)}>
                                    <Close fontSize='inherit' />
                                </IconButton>
                            </Tooltip>
                        }
                        severity='info'
                        sx={{ mb: 2 }}
                    >
                        Ingrese los datos para crearse como usuario administrador dentro de la plataforma
                    </Alert>
                </Collapse>

                <Collapse in={openWarning}>
                    <Alert
                        action={
                            <Tooltip title='Cerrar alerta'>
                                <IconButton color='inherit' size='small' onClick={() => setOpenWarning(false)}>
                                    <Close fontSize='inherit' />
                                </IconButton>
                            </Tooltip>
                        }
                        severity='warning'
                        sx={{ mb: 2 }}
                    >
                        Si ya existe un administrador, no podrá ser creado y tendrá que contactar al administrador
                    </Alert>
                </Collapse>

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
                    Nombre
                </Box>} variant='outlined' type='text' value={name} onChange={(e) => setName(e.target.value)} sx={{ mt: 1, mb: 2 }} />

                <TextField fullWidth label={<Box display={'flex'} alignItems={'center'}>
                    <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                    Apellido
                </Box>} variant='outlined' type='text' value={surname} onChange={(e) => setSurname(e.target.value)} sx={{ mb: 2 }} />

                <TextField fullWidth label={<Box display={'flex'} alignItems={'center'}>
                    <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                    Usuario
                </Box>} variant='outlined' type='text' value={username} onChange={(e) => setUsername(e.target.value)} sx={{ mb: 2 }} />

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
                <Button variant='text' color='primary' onClick={handleRegister}>
                    <Typography variant='button'>Confirmar</Typography>
                </Button>
                <Button variant='text' color='inherit' onClick={() => setDialogRegister(false)}>
                    <Typography variant='button'>Cerrar</Typography>
                </Button>
            </DialogActions>
        </Dialog>
    )
};

export default Register;
