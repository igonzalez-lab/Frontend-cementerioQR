import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { Box, Button, IconButton, InputAdornment, Paper, TextField, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon, QuestionMark, Add } from '@mui/icons-material';

import { SHOW_ERROR_MESSAGE, SHOW_SUCCESS_MESSAGE } from '../../slices/notificationSlice';
import { SET_USER_DATA } from '../../slices/userSlice';
import { encryptMessage } from '../../helpers/helpers';
import Register from './Register';
import Password from './Password';

const Login = () => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const mobileScreen = useMediaQuery(theme.breakpoints.between('xs', 'sm'));

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [dialogPassword, setDialogPassword] = useState(false);
    const [dialogRegister, setDialogRegister] = useState(false);

    const handleLogin = useCallback(async () => {
        try {
            if (username === '') {
                throw new Error('El Usuario es obligatorio');
            }

            if (password === '') {
                throw new Error('La Contraseña es Obligatoria');
            }

            const requestHeader = new Headers();
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                username: encryptMessage(username.trim()),
                password: encryptMessage(password.trim()),
            });

            const requestOptions = {
                method: 'POST',
                body: requestBody,
                headers: requestHeader
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/auth/sign-in`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setUsername('');
            setPassword('');

            dispatch(SET_USER_DATA(encryptMessage(responseJson.message)));
            dispatch(SHOW_SUCCESS_MESSAGE('Bienvenido, acceso correcto'));
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [username, password, dispatch, setUsername, setPassword]);

    return (
        <Box width={'100%'} display={'flex'} justifyContent={'center'}>
            <Box component={Paper} elevation={0} variant='outlined' p={2} m={1} display={'flex'} flexDirection={'column'} alignItems={'center'} maxWidth={403}>
                <img src='images/logo.png' />

                <TextField fullWidth label='Usuario' variant='outlined' type='text' value={username} onChange={(e) => setUsername(e.target.value)} sx={{ mt: 2 }} />
                <TextField fullWidth label='Contraseña' variant='outlined' type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mt: 2 }} slotProps={{
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

                {mobileScreen ? (
                    <Box display={'flex'} flexDirection={'column'} alignItems={'center'} mt={2} width={'100%'}>
                        <Button disableElevation fullWidth variant='contained' color='primary' onClick={handleLogin} startIcon={<LoginIcon />}>
                            <Typography variant='button'>Iniciar sesión</Typography>
                        </Button>
                        <Button disableElevation fullWidth variant='outlined' color='primary' onClick={() => setDialogPassword(true)} startIcon={<QuestionMark />} sx={{ mt: 2 }}>
                            <Typography variant='button'>Olvidé mi contraseña</Typography>
                        </Button>
                    </Box>
                ) : (
                    <Box display={'flex'} alignItems={'center'} mt={2} width={'100%'}>
                        <Button disableElevation variant='contained' color='primary' onClick={handleLogin} startIcon={<LoginIcon />}>
                            <Typography variant='button'>Iniciar sesión</Typography>
                        </Button>
                        <Button disableElevation variant='outlined' color='primary' onClick={() => setDialogPassword(true)} startIcon={<QuestionMark />} sx={{ ml: 2 }}>
                            <Typography variant='button'>Olvidé mi contraseña</Typography>
                        </Button>
                    </Box>
                )}

                <Box display={'flex'} alignItems={'center'} mt={2} width={'100%'}>
                    <Button fullWidth disableElevation variant='outlined' color='secondary' startIcon={<Add />} onClick={() => setDialogRegister(true)}>
                        <Typography variant='button'>Registrarme</Typography>
                    </Button>
                </Box>
            </Box>

            <Password dialogPassword={dialogPassword} setDialogPassword={setDialogPassword} />
            <Register dialogRegister={dialogRegister} setDialogRegister={setDialogRegister} />
        </Box>
    )
};

export default Login;
