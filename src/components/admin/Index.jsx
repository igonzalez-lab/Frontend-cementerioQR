import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Link as LinkRRD } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { SHOW_ERROR_MESSAGE, SHOW_SUCCESS_MESSAGE } from './../../slices/notificationSlice';

import { AdminPanelSettings, ArrowBack, Delete, Edit, Emergency, FilterList, FilterListOff, Home, Password, Person, PersonAdd, PersonOff, Refresh, Replay, Visibility, VisibilityOff, Warning } from '@mui/icons-material';
import { Box, Breadcrumbs, Typography, Link as LinkMUI, useTheme, useMediaQuery, Dialog, DialogTitle, Tooltip, IconButton, DialogContent, Paper, TextField, InputAdornment, DialogActions, Button, CircularProgress, TableContainer, Table, TableHead, TableRow, TableCell, TablePagination, TableBody, Alert, FormControl, InputLabel, Select, MenuItem, Pagination } from '@mui/material';

import { jwtDecode } from 'jwt-decode';
import { decryptMessage, encryptMessage } from '../../helpers/helpers';

const Index = () => {
    const getUsersRef = useRef(true);

    const theme = useTheme();
    const dispatch = useDispatch();
    const token = useSelector((state) => state.user_cementerio_qr.data);
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const mobileScreen = useMediaQuery(theme.breakpoints.between('xs', 'sm'));

    const [users, setUsers] = useState(null);
    const [usersError, setUsersError] = useState(false);
    const [usersErrorMessage, setUsersErrorMessage] = useState('');

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filterUsers, setFilterUsers] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [filterUsersValue, setFilterUsersValue] = useState('');

    const [dialogUpdate, setDialogUpdate] = useState(false);
    const [dialogDelete, setDialogDelete] = useState(false);
    const [dialogRegister, setDialogRegister] = useState(false);
    const [dialogPassword, setDialogPassword] = useState(false);

    const [rol, setRol] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [personas, setPersonas] = useState([]);
    const [repeatPassword, setRepeatPassword] = useState('');
    const [visiblePassword, setVisiblePassword] = useState(false);

    const [pageP, setPageP] = useState(1);
    const [countP, setCountP] = useState(null);
    const [rowsPerPageP, setRowsPerPageP] = useState(7);

    const [data, setData] = useState(null);
    const [dataError, setDataError] = useState(false);
    const [dataErrorMessage, setDataErrorMessage] = useState('');


    const handleCleanFields = useCallback(() => {
        setRol('');
        setName('');
        setSurname('');
        setUsername('');
        setPassword('');
        setPersonas([]);
        setRepeatPassword('');
    }, [setRol, setName, setSurname, setUsername, setPassword, setPersonas, setRepeatPassword]);

    const handleOpenDialogPassword = useCallback((row) => {
        setSelectedUser(row);
        setDialogPassword(true);
    }, [setSelectedUser, setDialogPassword]);

    const handleOpenDialogUpdate = useCallback((row) => {
        setSelectedUser(row);
        setDialogUpdate(true);

        setName(decryptMessage(row.nombre));
        setSurname(decryptMessage(row.apellido));
        setUsername(decryptMessage(row.usuario));
        setRol(row.rol);
        setPersonas(JSON.parse(decryptMessage(row.personas)));
    }, [setSelectedUser, setDialogUpdate, setName, setSurname, setUsername, setRol, setPersonas]);

    const handleOpenDialogDelete = useCallback((row) => {
        setSelectedUser(row);
        setDialogDelete(true);
    }, [setSelectedUser, setDialogDelete]);


    const handleGetData = useCallback(async (page, rows) => {
        try {
            setData(null);

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestOptions = {
                method: 'GET',
                headers: requestHeader,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/people/${page}/${rows}`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setData(responseJson.message);
            setDataError(false);
            setDataErrorMessage('');
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));

            setData(null);
            setDataError(true);
            setDataErrorMessage(error.message);
        }
    }, [token, dispatch, setData, setDataError, setDataErrorMessage]);

    const handleGetDataCount = useCallback(async () => {
        try {
            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestOptions = {
                method: 'GET',
                headers: requestHeader,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/people/count`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setCountP(responseJson.message);
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [token, dispatch, setCountP]);


    const handleGetUsers = useCallback(async () => {
        if (!getUsersRef.current) {
            return;
        }

        try {
            setFilterUsersValue('');
            setFilterUsers(false);
            setUsers(null);

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestOptions = {
                method: 'GET',
                headers: requestHeader,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/auth/`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setUsers(responseJson.message);
            setUsersError(false);
            setUsersErrorMessage('');
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));

            setUsers(error.message);
            setUsersError(false);
            setUsersErrorMessage('');
        }
        finally {
            getUsersRef.current = false;
        }
    }, [token, getUsersRef, dispatch, setUsers, setUsersError, setUsersErrorMessage, setFilterUsers, setFilterUsersValue]);

    const handleCallGetUsers = useCallback(async () => {
        getUsersRef.current = true;
        await handleGetUsers();
    }, [getUsersRef, handleGetUsers]);

    const handlePostUser = useCallback(async () => {
        try {
            if (name === '') {
                throw new Error('El Nombre no puede estar vacío');
            }

            if (surname === '') {
                throw new Error('El Apellido no puede estar vacío');
            }

            if (username === '') {
                throw new Error('El Usuario no puede estar vacío');
            }

            if (rol === '') {
                throw new Error('El Rol no puede estar vacío');
            } else if (rol === '2' && personas.length <= 0) {
                throw new Error('Debe seleccionar una o mas personas');
            }

            if (password === '' || repeatPassword === '') {
                throw new Error("La Contraseña no puede estar vacía");
            }

            if (password !== repeatPassword) {
                throw new Error("Las Contraseñas no coinciden");
            }

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                name: encryptMessage(String(name).trim()),
                surname: encryptMessage(String(surname).trim()),
                username: encryptMessage(String(username).trim()),
                password: encryptMessage(String(password).trim()),
                role: encryptMessage(String(rol).trim()),
                personas: encryptMessage(JSON.stringify(personas))
            });

            const requestOptions = {
                method: 'POST',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/auth/`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                return dispatch(SHOW_ERROR_MESSAGE(responseJson.message));
            }

            dispatch(SHOW_SUCCESS_MESSAGE('Usuario creado correctamente'));
            setDialogRegister(false);
            handleCleanFields();

            await handleCallGetUsers();
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [dispatch, handleCleanFields, setDialogRegister, handleCallGetUsers, name, surname, username, password, repeatPassword, rol, personas]);

    const handlePutUser = useCallback(async () => {
        try {
            if (name === '') {
                throw new Error('El Nombre no puede estar vacío');
            }

            if (surname === '') {
                throw new Error('El Apellido no puede estar vacío');
            }

            if (username === '') {
                throw new Error('El Usuario no puede estar vacío');
            }

            if (rol === '') {
                throw new Error('El Rol no puede estar vacío');
            } else if (rol === '2' && personas.length <= 0) {
                throw new Error('Debe seleccionar una o mas personas');
            }

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                id: encryptMessage(String(selectedUser.id).trim()),
                name: encryptMessage(String(name).trim()),
                surname: encryptMessage(String(surname).trim()),
                username: encryptMessage(String(username).trim()),
                role: encryptMessage(String(rol).trim()),
                personas: encryptMessage(JSON.stringify(personas))
            });

            const requestOptions = {
                method: 'PUT',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/auth/`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                return dispatch(SHOW_ERROR_MESSAGE(responseJson.message));
            }

            dispatch(SHOW_SUCCESS_MESSAGE(responseJson.message));
            setDialogUpdate(false);
            handleCleanFields();

            await handleCallGetUsers();
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [dispatch, handleCleanFields, setDialogUpdate, handleCallGetUsers, name, surname, username, rol, personas, selectedUser]);

    const handleDeleteUser = useCallback(async () => {
        try {
            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                user_id: encryptMessage(String(selectedUser.id).trim()),
            });

            const requestOptions = {
                method: 'DELETE',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/auth/`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                return dispatch(SHOW_ERROR_MESSAGE(responseJson.message));
            }

            dispatch(SHOW_SUCCESS_MESSAGE(responseJson.message));
            setDialogDelete(false);
            await handleCallGetUsers();
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [token, selectedUser, dispatch, setDialogDelete, handleCallGetUsers]);


    const handlePutUnBlockUser = useCallback(async (id) => {
        try {
            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestOptions = {
                method: 'PUT',
                headers: requestHeader,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/auth/un-block/${id}`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                return dispatch(SHOW_ERROR_MESSAGE(responseJson.message));
            }

            dispatch(SHOW_SUCCESS_MESSAGE(responseJson.message));
            await handleCallGetUsers();
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [dispatch, handleCallGetUsers]);

    const handlePutPasswordUser = useCallback(async () => {
        try {
            if (password !== repeatPassword) {
                throw new Error('Las contraseñas no coinciden');
            }

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                user_id: encryptMessage(String(selectedUser.id).trim()),
                password: encryptMessage(String(password).trim())
            });

            const requestOptions = {
                method: 'PUT',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/auth/password`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                return dispatch(SHOW_ERROR_MESSAGE(responseJson.message));
            }

            dispatch(SHOW_SUCCESS_MESSAGE(responseJson.message));
            handleCleanFields();
            setDialogPassword(false);
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [token, password, repeatPassword, selectedUser, dispatch, handleCleanFields, setDialogPassword]);


    useEffect(() => {
        handleGetUsers();
    }, [handleGetUsers]);

    useEffect(() => {
        handleGetDataCount();
        handleGetData(pageP, rowsPerPageP);
    }, [pageP, rowsPerPageP, handleGetDataCount, handleGetData]);


    const filteredUsers = filterUsersValue ? users.filter((row) =>
        ['nombre', 'apellido', 'usuario'].some((key) =>
            row[key] !== null && decryptMessage(row[key]).toLowerCase().includes(filterUsersValue.toLowerCase())
        )) : users;

    return (
        <Box maxWidth={mobileScreen ? '87vw' : '100%'}>
            <Box display={'flex'} alignItems={'center'}>
                <AdminPanelSettings fontSize='large' />
                <Typography variant='h4' ml={1}>Admin. Usuarios</Typography>
            </Box>

            <Box role='presentation' onClick={(e) => e.preventDefault()} mb={2}>
                <Breadcrumbs maxItems={5}>
                    <LinkMUI underline='hover' color='textSecondary' display={'flex'} alignItems={'center'} component={LinkRRD} to={'/'}>
                        <Home sx={{ mr: 0.5 }} fontSize='inherit' />
                        <Typography>Menú Principal</Typography>
                    </LinkMUI>
                    <LinkMUI underline='hover' color='textPrimary' display={'flex'} alignItems={'center'} component={LinkRRD} to={'/admin'}>
                        <AdminPanelSettings sx={{ mr: 0.5 }} fontSize='inherit' />
                        <Typography>Admin. Usuarios</Typography>
                    </LinkMUI>
                </Breadcrumbs>
            </Box>

            <Box mt={2}>
                {usersError ? (
                    <Box mt={2} component={Paper} elevation={0} variant='outlined' display={'flex'} flexDirection={'column'} justifyContent={'center'} p={2}>
                        <Box display={'flex'} alignItems={'center'} mb={1}>
                            <Warning color='warning' fontSize='large' />
                            <Typography ml={1}>Error al obtener los Usuarios: {usersErrorMessage}</Typography>
                        </Box>
                        <Button disableElevation variant='contained' color='primary' startIcon={<Refresh />} sx={{ width: 'fit-content' }} onClick={handleCallGetUsers}>
                            <Typography variant='button'>Consultar nuevamente</Typography>
                        </Button>
                    </Box>
                ) : users === null ? (
                    <Box mt={2} component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                        <CircularProgress />
                        <Typography ml={2}>Cargando información</Typography>
                    </Box>
                ) : (
                    <Fragment>
                        <Box display={'flex'} alignItems={'center'} flexWrap={'wrap'} mt={2}>
                            <Button disableElevation variant='contained' color='info' startIcon={<ArrowBack />} sx={{ mr: 2, mb: 2 }} component={LinkRRD} to={'/'}>
                                <Typography variant='button'>Volver a Menú Principal</Typography>
                            </Button>

                            <Button disableElevation color='primary' variant='contained' startIcon={<PersonAdd />} sx={{ mr: 2, mb: 2 }} onClick={() => setDialogRegister(true)}>
                                <Typography variant='button'>Nuevo Usuario</Typography>
                            </Button>

                            <Button disableElevation color='primary' variant='contained' startIcon={<Replay />} sx={{ mr: 2, mb: 2 }} onClick={handleCallGetUsers}>
                                <Typography variant='button'>Recargar Usuarios</Typography>
                            </Button>

                            <Button disableElevation color='primary' variant='contained' startIcon={filterUsers ? <FilterListOff /> : <FilterList />} sx={{ mr: 2, mb: 2 }} onClick={() => setFilterUsers(!filterUsers)}>
                                <Typography variant='button'>{filterUsers ? 'Ocultar Filtro' : 'Mostrar Filtro'}</Typography>
                            </Button>
                        </Box>

                        {filterUsers && (
                            <Box component={Paper} elevation={0} variant='outlined' p={2} display={'flex'} flexDirection={'column'} mb={2}>
                                <Alert severity='info' sx={{ mb: 2 }}>Busque por cualquier dato de la tabla <b>(Nombre, Apellido, Usuario)</b></Alert>

                                <TextField fullWidth label='Filtro Usuarios' type='search' variant='outlined' value={filterUsersValue} onChange={(e) => setFilterUsersValue(e.target.value)} />
                            </Box>
                        )}

                        <Typography fontWeight={900} mb={2} fontSize={17} sx={{ textDecoration: 'underline' }}>Registros Actuales: {filteredUsers.length}</Typography>

                        <Box component={Paper} elevation={0} variant='outlined' overflow={'auto'} m={'auto'}>
                            <TableContainer sx={{ maxHeight: '53vh' }}>
                                <Table size='small' stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align='center' sx={{ fontSize: 17 }}>Nombre</TableCell>
                                            <TableCell align='center' sx={{ fontSize: 17 }}>Apellido</TableCell>
                                            <TableCell align='center' sx={{ fontSize: 17 }}>Usuario</TableCell>
                                            <TableCell align='center' sx={{ fontSize: 17 }}>Rol</TableCell>
                                            <TableCell align='center' sx={{ fontSize: 17 }}>Bloqueado</TableCell>
                                            <TableCell />
                                            <TableCell />
                                            <TableCell />
                                            <TableCell />
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredUsers
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((row) => (
                                                <TableRow key={row.id}>
                                                    <TableCell align='center'>{decryptMessage(row.nombre)}</TableCell>
                                                    <TableCell align='center'>{decryptMessage(row.apellido)}</TableCell>
                                                    <TableCell align='center'>{decryptMessage(row.usuario)}</TableCell>
                                                    <TableCell align='center'>
                                                        {String(row.rol).trim() === '0' ? (
                                                            'Público General'
                                                        ) : String(row.rol).trim() === '1' ? (
                                                            'Miembro de la Comunidad'
                                                        ) : String(row.rol).trim() === '2' ? (
                                                            'Familiar Directo'
                                                        ) : String(row.rol).trim() === '3' ? (
                                                            'Investigador Acreditado'
                                                        ) : String(row.rol).trim() === '4' ? (
                                                            'Autoridades Rabínicas'
                                                        ) : String(row.rol).trim() === '5' && (
                                                            'Administrador'
                                                        )}
                                                    </TableCell>
                                                    <TableCell align='center'>
                                                        {String(row.bloqueado) === '1' ? (
                                                            <Typography variant='body2' color='success' fontWeight={900}>SI</Typography>
                                                        ) : (
                                                            <Typography variant='body2' color='error' fontWeight={900}>NO</Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align='center'>
                                                        <Tooltip title={String(row.bloqueado).trim() === '0' ? 'Bloquear usuario' : 'Desbloquear usuario'}>
                                                            <IconButton onClick={() => handlePutUnBlockUser(row.id)}>
                                                                {String(row.bloqueado).trim() === '0' ? <Person /> : <PersonOff />}
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell align='center'>
                                                        <Tooltip title='Cambiar contraseña'>
                                                            <IconButton onClick={() => handleOpenDialogPassword(row)}>
                                                                <Password />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell align='center'>
                                                        <Tooltip title='Editar'>
                                                            <IconButton onClick={() => handleOpenDialogUpdate(row)}>
                                                                <Edit />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell align='center'>
                                                        {String(decryptMessage(jwtDecode(decryptMessage(token)).id)) !== String(row.id) && (
                                                            <Fragment>
                                                                <Tooltip title='Eliminar'>
                                                                    <IconButton onClick={() => handleOpenDialogDelete(row)}>
                                                                        <Delete />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Fragment>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                rowsPerPageOptions={[10, 25, 50, 100]}
                                component='div'
                                count={filteredUsers.length}
                                rowsPerPage={rowsPerPage}
                                labelRowsPerPage={'Filas por página'}
                                labelDisplayedRows={({ from, to, count }) => {
                                    return `${from}–${to} de ${count !== -1 ? count : `mas que ${to}`}`;
                                }}
                                page={page}
                                onPageChange={(e, v) => setPage(v)}
                                onRowsPerPageChange={(e) => {
                                    setRowsPerPage(+e.target.value);
                                    setPage(0);
                                }}
                            />
                        </Box>
                    </Fragment>
                )}
            </Box>

            <Dialog open={dialogRegister} fullScreen={fullScreen} maxWidth='sm' fullWidth onClose={() => setDialogRegister(false)}>
                <DialogTitle>Crear Usuario</DialogTitle>
                <DialogContent>
                    <Alert severity='error' sx={{ mb: 2 }}>
                        <Box display={'flex'} alignItems={'center'}>
                            <Emergency color='error' fontSize='small' sx={{ mr: 1 }} />
                            Datos obligatorios
                        </Box>
                    </Alert>

                    <TextField fullWidth variant='outlined' label={<Box display={'flex'} alignItems={'center'}>
                        <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                        Nombre
                    </Box>} value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />
                    <TextField fullWidth variant='outlined' label={<Box display={'flex'} alignItems={'center'}>
                        <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                        Apellido
                    </Box>} value={surname} onChange={(e) => setSurname(e.target.value)} sx={{ mb: 2 }} />
                    <TextField fullWidth variant='outlined' label={<Box display={'flex'} alignItems={'center'}>
                        <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                        Usuario
                    </Box>} value={username} onChange={(e) => setUsername(e.target.value)} sx={{ mb: 2 }} />
                    <TextField fullWidth variant='outlined' label={<Box display={'flex'} alignItems={'center'}>
                        <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                        Contraseña
                    </Box>} type={visiblePassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} slotProps={{
                        input: {
                            endAdornment:
                                <InputAdornment position='end'>
                                    <Tooltip title={visiblePassword ? 'Ocultar contrseña' : 'Mostrar contraseña'}>
                                        <IconButton onClick={() => setVisiblePassword(!visiblePassword)} sx={{ mr: 1 }}>{visiblePassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                                    </Tooltip>
                                </InputAdornment>
                        }
                    }} />
                    <TextField fullWidth variant='outlined' label={<Box display={'flex'} alignItems={'center'}>
                        <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                        Repetir Contraseña
                    </Box>} type={visiblePassword ? 'text' : 'password'} value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} sx={{ mb: 2 }} slotProps={{
                        input: {
                            endAdornment:
                                <InputAdornment position='end'>
                                    <Tooltip title={visiblePassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                                        <IconButton onClick={() => setVisiblePassword(!visiblePassword)} sx={{ mr: 1 }}>{visiblePassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                                    </Tooltip>
                                </InputAdornment>
                        }
                    }} />

                    <FormControl fullWidth>
                        <InputLabel id='select-rol-label'>
                            <Box display={'flex'} alignItems={'center'}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                                Rol
                            </Box>
                        </InputLabel>
                        <Select labelId='select-rol-label' id='select-rol' value={rol} label='*** Rol' onChange={(e) => setRol((p) => e.target.value)}>
                            <MenuItem value={'0'}>Público General</MenuItem>
                            <MenuItem value={'1'}>Miembro de la Comunidad</MenuItem>
                            <MenuItem value={'2'}>Familiar Directo</MenuItem>
                            <MenuItem value={'3'}>Investigador Acreditado</MenuItem>
                            <MenuItem value={'4'}>Autoridades Rabínicas</MenuItem>
                            <MenuItem value={'5'}>Administrador</MenuItem>
                        </Select>
                    </FormControl>

                    {rol === '2' && (
                        dataError ? (
                            <Box mt={2} component={Paper} elevation={0} variant='outlined' display={'flex'} flexDirection={'column'} justifyContent={'center'} p={2}>
                                <Box display={'flex'} alignItems={'center'} mb={1}>
                                    <Warning color='warning' fontSize='large' />
                                    <Typography ml={1}>Error al obtener las personas: {dataErrorMessage}</Typography>
                                </Box>
                                <Button disableElevation variant='contained' color='primary' startIcon={<Refresh />} sx={{ width: 'fit-content' }} onClick={() => handleGetData(pageP, rowsPerPageP)}>
                                    <Typography variant='button'>Consultar nuevamente</Typography>
                                </Button>
                            </Box>
                        ) : data === null ? (
                            <Box mt={2} component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                                <CircularProgress />
                                <Typography ml={2}>Cargando personas</Typography>
                            </Box>
                        ) : (
                            <Fragment>
                                <Box component={Paper} elevation={0} variant='outlined' overflow={'auto'} m={'auto'} mt={2}>
                                    <TableContainer sx={{ maxHeight: '53vh' }}>
                                        <Table size='small' stickyHeader>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell align='center' colSpan={3} sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Nombres</TableCell>
                                                    <TableCell align='center' colSpan={4} sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Fecha y Lugar de Nacimiento</TableCell>
                                                    <TableCell align='center' colSpan={2} sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Fecha de Fallecimiento</TableCell>
                                                    <TableCell align='center' sx={{ fontSize: 17, borderBottom: 0 }} />
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell align='center' sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Español</TableCell>
                                                    <TableCell align='center' sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Hebreo</TableCell>
                                                    <TableCell align='center' sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Yiddish</TableCell>
                                                    <TableCell align='center' sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Gregoriano</TableCell>
                                                    <TableCell align='center' sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Hebreo</TableCell>
                                                    <TableCell align='center' sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>País</TableCell>
                                                    <TableCell align='center' sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Ciudad</TableCell>
                                                    <TableCell align='center' sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Gregoriano</TableCell>
                                                    <TableCell align='center' sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Hebreo</TableCell>
                                                    <TableCell />
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {data.map((value, index) => (
                                                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 }, }}>
                                                        <TableCell align='center'>{decryptMessage(value.nombre_espanol)}</TableCell>
                                                        <TableCell align='center'>{decryptMessage(value.nombre_hebreo)}</TableCell>
                                                        <TableCell align='center' style={{ borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>{decryptMessage(value.nombre_yiddish)}</TableCell>
                                                        <TableCell align='center'>{decryptMessage(value.fecha_nacimiento_gregoriano)}</TableCell>
                                                        <TableCell align='center' style={{ borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>{decryptMessage(value.fecha_nacimiento_hebreo)}</TableCell>
                                                        <TableCell align='center'>{decryptMessage(value.pais)}</TableCell>
                                                        <TableCell align='center' style={{ borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>{decryptMessage(value.ciudad)}</TableCell>
                                                        <TableCell align='center'>{decryptMessage(value.fecha_muerte_gregoriano)}</TableCell>
                                                        <TableCell align='center' style={{ borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>{decryptMessage(value.fecha_muerte_hebreo)}</TableCell>
                                                        <TableCell align='center'>
                                                            <Button variant='text' color={personas.includes(String(value.id)) ? 'error' : 'primary'}
                                                                onClick={() => {
                                                                    const id = String(value.id).trim();

                                                                    setPersonas((prev) => {
                                                                        const exists = prev.some((x) => String(x).trim() === id);
                                                                        return exists
                                                                            ? prev.filter((x) => String(x).trim() !== id)
                                                                            : [...prev, id];
                                                                    });
                                                                }}
                                                            >
                                                                {personas.includes(String(value.id)) ? 'Quitar' : 'Agregar'}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>

                                <Pagination count={Math.ceil(countP / rowsPerPageP)} page={pageP} onChange={(e, value) => setPageP(value)} color='primary' sx={{ mt: 2, display: 'flex', justifyContent: 'center' }} />
                            </Fragment>
                        )
                    )}
                </DialogContent>
                <DialogActions>
                    <Button variant='text' color='primary' onClick={handlePostUser}>
                        <Typography variant='button'>Crear usuario</Typography>
                    </Button>
                    <Button variant='text' color='inherit' onClick={() => setDialogRegister(false)}>
                        <Typography variant='button'>Cerrar ventana</Typography>
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={dialogUpdate} fullScreen={fullScreen} maxWidth='sm' fullWidth onClose={() => setDialogUpdate(false)}>
                <DialogTitle>Actualizar Usuario</DialogTitle>
                <DialogContent>
                    <Alert severity='error' sx={{ mb: 2 }}>
                        <Box display={'flex'} alignItems={'center'}>
                            <Emergency color='error' fontSize='small' sx={{ mr: 1 }} />
                            Datos obligatorios
                        </Box>
                    </Alert>

                    {selectedUser === null ? (
                        <Alert severity='warning' sx={{ mb: 2 }}>Seleccione un usuario</Alert>
                    ) : (
                        <Alert severity='info' sx={{ mb: 2 }}>Esta editando a {decryptMessage(selectedUser.nombre)} {decryptMessage(selectedUser.apellido)}</Alert>
                    )}

                    <TextField fullWidth variant='outlined' label={<Box display={'flex'} alignItems={'center'}>
                        <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                        Nombre
                    </Box>} value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />
                    <TextField fullWidth variant='outlined' label={<Box display={'flex'} alignItems={'center'}>
                        <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                        Apellido
                    </Box>} value={surname} onChange={(e) => setSurname(e.target.value)} sx={{ mb: 2 }} />
                    <TextField fullWidth variant='outlined' label={<Box display={'flex'} alignItems={'center'}>
                        <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                        Usuario
                    </Box>} value={username} onChange={(e) => setUsername(e.target.value)} sx={{ mb: 2 }} />

                    <FormControl fullWidth>
                        <InputLabel id='select-rol-label'>
                            <Box display={'flex'} alignItems={'center'}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                                Rol
                            </Box>
                        </InputLabel>
                        <Select labelId='select-rol-label' id='select-rol' value={rol} label='*** Rol' onChange={(e) => setRol((p) => e.target.value)}>
                            <MenuItem value={'0'}>Público General</MenuItem>
                            <MenuItem value={'1'}>Miembro de la Comunidad</MenuItem>
                            <MenuItem value={'2'}>Familiar Directo</MenuItem>
                            <MenuItem value={'3'}>Investigador Acreditado</MenuItem>
                            <MenuItem value={'4'}>Autoridades Rabínicas</MenuItem>
                            <MenuItem value={'5'}>Administrador</MenuItem>
                        </Select>
                    </FormControl>

                    {rol === '2' && (
                        dataError ? (
                            <Box mt={2} component={Paper} elevation={0} variant='outlined' display={'flex'} flexDirection={'column'} justifyContent={'center'} p={2}>
                                <Box display={'flex'} alignItems={'center'} mb={1}>
                                    <Warning color='warning' fontSize='large' />
                                    <Typography ml={1}>Error al obtener las personas: {dataErrorMessage}</Typography>
                                </Box>
                                <Button disableElevation variant='contained' color='primary' startIcon={<Refresh />} sx={{ width: 'fit-content' }} onClick={() => handleGetData(pageP, rowsPerPageP)}>
                                    <Typography variant='button'>Consultar nuevamente</Typography>
                                </Button>
                            </Box>
                        ) : data === null ? (
                            <Box mt={2} component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                                <CircularProgress />
                                <Typography ml={2}>Cargando personas</Typography>
                            </Box>
                        ) : (
                            <Fragment>
                                <Box component={Paper} elevation={0} variant='outlined' overflow={'auto'} m={'auto'} mt={2}>
                                    <TableContainer sx={{ maxHeight: '53vh' }}>
                                        <Table size='small' stickyHeader>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell align='center' colSpan={3} sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Nombres</TableCell>
                                                    <TableCell align='center' colSpan={4} sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Fecha y Lugar de Nacimiento</TableCell>
                                                    <TableCell align='center' colSpan={2} sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Fecha de Fallecimiento</TableCell>
                                                    <TableCell align='center' sx={{ fontSize: 17, borderBottom: 0 }} />
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell align='center' sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Español</TableCell>
                                                    <TableCell align='center' sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Hebreo</TableCell>
                                                    <TableCell align='center' sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Yiddish</TableCell>
                                                    <TableCell align='center' sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Gregoriano</TableCell>
                                                    <TableCell align='center' sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Hebreo</TableCell>
                                                    <TableCell align='center' sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>País</TableCell>
                                                    <TableCell align='center' sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Ciudad</TableCell>
                                                    <TableCell align='center' sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Gregoriano</TableCell>
                                                    <TableCell align='center' sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Hebreo</TableCell>
                                                    <TableCell />
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {data.map((value, index) => (
                                                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 }, }}>
                                                        <TableCell align='center'>{decryptMessage(value.nombre_espanol)}</TableCell>
                                                        <TableCell align='center'>{decryptMessage(value.nombre_hebreo)}</TableCell>
                                                        <TableCell align='center' style={{ borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>{decryptMessage(value.nombre_yiddish)}</TableCell>
                                                        <TableCell align='center'>{decryptMessage(value.fecha_nacimiento_gregoriano)}</TableCell>
                                                        <TableCell align='center' style={{ borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>{decryptMessage(value.fecha_nacimiento_hebreo)}</TableCell>
                                                        <TableCell align='center'>{decryptMessage(value.pais)}</TableCell>
                                                        <TableCell align='center' style={{ borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>{decryptMessage(value.ciudad)}</TableCell>
                                                        <TableCell align='center'>{decryptMessage(value.fecha_muerte_gregoriano)}</TableCell>
                                                        <TableCell align='center' style={{ borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>{decryptMessage(value.fecha_muerte_hebreo)}</TableCell>
                                                        <TableCell align='center'>
                                                            <Button variant='text' color={personas.includes(String(value.id)) ? 'error' : 'primary'}
                                                                onClick={() => {
                                                                    const id = String(value.id).trim();

                                                                    setPersonas((prev) => {
                                                                        const exists = prev.some((x) => String(x).trim() === id);
                                                                        return exists
                                                                            ? prev.filter((x) => String(x).trim() !== id)
                                                                            : [...prev, id];
                                                                    });
                                                                }}
                                                            >
                                                                {personas.includes(String(value.id)) ? 'Quitar' : 'Agregar'}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>

                                <Pagination count={Math.ceil(countP / rowsPerPageP)} page={pageP} onChange={(e, value) => setPageP(value)} color='primary' sx={{ mt: 2, display: 'flex', justifyContent: 'center' }} />
                            </Fragment>
                        )
                    )}
                </DialogContent>
                <DialogActions>
                    <Button variant='text' color='primary' onClick={handlePutUser}>
                        <Typography variant='button'>Actualizar usuario</Typography>
                    </Button>
                    <Button variant='text' color='inherit' onClick={() => setDialogUpdate(false)}>
                        <Typography variant='button'>Cerrar ventana</Typography>
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={dialogDelete} fullScreen={fullScreen} maxWidth='sm' fullWidth onClose={() => setDialogDelete(false)}>
                <DialogTitle>Eliminar Usuario</DialogTitle>
                <DialogContent>
                    {selectedUser === null ? (
                        <Alert severity='warning'>Seleccione un usuario</Alert>
                    ) : (
                        <Alert severity='info'>Esta seguro de eliminar al usuario <b>{decryptMessage(selectedUser.nombre)} {decryptMessage(selectedUser.apellido)}</b>?</Alert>
                    )}
                </DialogContent>
                {selectedUser !== null && (
                    <Fragment>
                        <DialogActions>
                            <Button variant='text' color='primary' onClick={handleDeleteUser}>
                                <Typography variant='button'>Eliminar usuario</Typography>
                            </Button>
                            <Button variant='text' color='inherit' onClick={() => setDialogDelete(false)}>
                                <Typography variant='button'>Cerrar ventana</Typography>
                            </Button>
                        </DialogActions>
                    </Fragment>
                )}
            </Dialog>

            <Dialog open={dialogPassword} fullScreen={fullScreen} maxWidth='sm' fullWidth onClose={() => setDialogPassword(false)}>
                <DialogTitle>Cambiar contraseña</DialogTitle>
                <DialogContent>
                    {selectedUser === null ? (
                        <Alert severity='warning'>Seleccione un usuario</Alert>
                    ) : (
                        <Fragment>
                            <Alert severity='info' sx={{ mb: 2 }}>Esta editando a {decryptMessage(selectedUser.nombre)} {decryptMessage(selectedUser.apellido)}</Alert>

                            <Alert severity='error' sx={{ mb: 2 }}>
                                <Box display={'flex'} alignItems={'center'}>
                                    <Emergency color='error' fontSize='small' sx={{ mr: 1 }} />
                                    Datos obligatorios
                                </Box>
                            </Alert>

                            <TextField fullWidth variant='outlined' label={<Box display={'flex'} alignItems={'center'}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                                Contraseña
                            </Box>} type={visiblePassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} slotProps={{
                                input: {
                                    endAdornment:
                                        <InputAdornment position='end'>
                                            <Tooltip title={visiblePassword ? 'Ocultar contrseña' : 'Mostrar contraseña'}>
                                                <IconButton onClick={() => setVisiblePassword(!visiblePassword)} sx={{ mr: 1 }}>{visiblePassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                                            </Tooltip>
                                        </InputAdornment>
                                }
                            }} />

                            <TextField fullWidth variant='outlined' label={<Box display={'flex'} alignItems={'center'}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                                Repetir Contraseña
                            </Box>} type={visiblePassword ? 'text' : 'password'} value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} slotProps={{
                                input: {
                                    endAdornment:
                                        <InputAdornment position='end'>
                                            <Tooltip title={visiblePassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                                                <IconButton onClick={() => setVisiblePassword(!visiblePassword)} sx={{ mr: 1 }}>{visiblePassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                                            </Tooltip>
                                        </InputAdornment>
                                }
                            }} />
                        </Fragment>
                    )}
                </DialogContent>
                {selectedUser !== null && (
                    <DialogActions>
                        <Button variant='text' color='primary' onClick={handlePutPasswordUser}>
                            <Typography variant='button'>Editar contraseña</Typography>
                        </Button>
                        <Button variant='text' color='inherit' onClick={() => setDialogPassword(false)}>
                            <Typography variant='button'>Cerrar Ventana</Typography>
                        </Button>
                    </DialogActions>
                )}
            </Dialog>
        </Box>
    )
};

export default Index;
