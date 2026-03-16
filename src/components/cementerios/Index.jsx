import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as LinkRRD } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';

import { Box, Breadcrumbs, Typography, useMediaQuery, useTheme, Link as LinkMUI, Avatar, Button, TextField, Paper, CircularProgress, TableContainer, Table, TableHead, TableRow, TableCell, Pagination, TableBody, Dialog, DialogTitle, DialogContent, DialogActions, Accordion, AccordionSummary, Tooltip, AccordionDetails, InputAdornment, Collapse, Alert, IconButton, List, ListItem, ListItemIcon, ListItemText, Menu, MenuList, MenuItem } from '@mui/material';
import { CheckCircle, Close, Edit, ExpandMore, FilterList, FilterListOff, Home, ManageAccounts, People, PersonAdd, Refresh, Replay, Warning, Error as ErrorIcon, Emergency, InsertDriveFile, Visibility, Delete, Image, ArrowBack, Filter1, Filter2, Filter3, Filter4, Filter5, Filter6, Filter7, Filter8, Filter9, FormatListBulleted, ExitToApp } from '@mui/icons-material';
import { blue } from '@mui/material/colors';

import { SHOW_ERROR_MESSAGE, SHOW_SUCCESS_MESSAGE } from '../../slices/notificationSlice';
import { decryptMessage, encryptMessage } from '../../helpers/helpers';
import { debounce } from 'lodash';
import { HDate } from '@hebcal/core';
import { jwtDecode } from 'jwt-decode';

const Index = () => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const token = useSelector((state) => state.user_cementerio_qr.data);
    const mobileScreen = useMediaQuery(theme.breakpoints.between('xs', 'sm'));

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const [dialogCreate, setDialogCreate] = useState(false);
    const [dialogUpdate, setDialogUpdate] = useState(false);
    const [dialogDelete, setDialogDelete] = useState(false);

    const [data, setData] = useState(null);
    const [dataError, setDataError] = useState(false);
    const [dataErrorMessage, setDataErrorMessage] = useState('');

    const [dataSearch, setDataSearch] = useState(null);
    const [dataSearchError, setDataSearchError] = useState(false);
    const [dataSearchErrorMessage, setDataSearchErrorMessage] = useState('');

    const [filter, setFilter] = useState(false);
    const [filterValue, setFilterValue] = useState('');

    const [page, setPage] = useState(1);
    const [pageSearch, setPageSearch] = useState(1);

    const [count, setCount] = useState(null);
    const [rowsPerPage, setRowsPerPage] = useState(7);
    const [selectedData, setSelectedData] = useState(null);

    const [openDanger, setOpenDanger] = useState(true);

    const [name, setName] = useState('');
    const [direction, setDirection] = useState('');


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

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/cementerios/${page}/${rows}`, requestOptions);
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

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/cementerios/count`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setCount(responseJson.message);
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [token, dispatch, setCount]);

    const handleGetDataSearch = useCallback(async (value) => {
        try {
            setDataSearch(null);

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestOptions = {
                method: 'GET',
                headers: requestHeader,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/cementerios/param/${value}`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setDataSearch(responseJson.message);
            setDataSearchError(false);
            setDataSearchErrorMessage('');
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));

            setDataSearch(null);
            setDataSearchError(true);
            setDataSearchErrorMessage(error.message);
        }
    }, [token, dispatch, setDataSearch, setDataSearchError, setDataSearchErrorMessage]);


    const handlePostCementerio = useCallback(async () => {
        try {
            if (name.trim() === '') {
                throw new Error('El nombre no es válido');
            }

            if (direction.trim() === '') {
                throw new Error('La dirección no es válido');
            }

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'name': encryptMessage(name.trim()),
                'direction': encryptMessage(direction.trim())
            });

            const requestOptions = {
                method: 'POST',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/cementerios/`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setName('');
            setDirection('');

            setDialogCreate(false);
            dispatch(SHOW_SUCCESS_MESSAGE(responseJson.message));

            if (filterValue === '') {
                await handleGetData(page, rowsPerPage);
            } else {
                await handleGetDataSearch(filterValue);
            }
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [page, token, rowsPerPage, filterValue, name, direction, dispatch, handleGetData, handleGetDataSearch]);

    const handlePutCementerio = useCallback(async () => {
        try {
            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'id': encryptMessage(String(selectedData.id)),
                'name': encryptMessage(name.trim()),
                'direction': encryptMessage(direction.trim())
            });

            const requestOptions = {
                method: 'PUT',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/cementerios/`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setName('');
            setDirection('');

            dispatch(SHOW_SUCCESS_MESSAGE(responseJson.message));
            setDialogUpdate(false);

            if (filterValue === '') {
                await handleGetData(page, rowsPerPage);
            } else {
                await handleGetDataSearch(filterValue);
            }
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [page, token, rowsPerPage, filterValue, selectedData, name, direction, dispatch, setDialogUpdate, encryptMessage, handleGetData, handleGetDataSearch]);

    const handleDeleteCementerio = useCallback(async () => {
        try {
            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'id': encryptMessage(String(selectedData.id))
            });

            const requestOptions = {
                method: 'DELETE',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/cementerios/`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            dispatch(SHOW_SUCCESS_MESSAGE(responseJson.message));
            setDialogDelete(false);

            if (filterValue === '') {
                await handleGetData(page, rowsPerPage);
            } else {
                await handleGetDataSearch(filterValue);
            }
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [token, page, rowsPerPage, filterValue, selectedData, dispatch, setDialogDelete, encryptMessage, decryptMessage]);


    const handleOpenDialogDelete = useCallback((payload) => {
        setSelectedData(payload);
        setDialogDelete(true);
    }, [setSelectedData, setDialogDelete]);

    const handleOpenDialogUpdate = useCallback(async (payload) => {
        setDialogUpdate(true);
        setSelectedData(payload);

        setName(decryptMessage(payload.nombre));
        setDirection(decryptMessage(payload.direccion));
    }, [setDialogUpdate, setSelectedData, setName, setDirection, decryptMessage]);

    const handleChangeRowsPerPage = useCallback((payload) => {
        setRowsPerPage(payload);
        setAnchorEl(null);
    }, [setRowsPerPage, setAnchorEl]);


    useEffect(() => {
        handleGetDataCount();
        handleGetData(page, rowsPerPage);
    }, [page, rowsPerPage, handleGetDataCount, handleGetData]);

    useEffect(() => {
        if (!filterValue) {
            setPage(1);
            setFilterValue('');
            return;
        }

        const debouncedSearch = debounce(async () => {
            await handleGetDataSearch(filterValue);
        }, 400);

        debouncedSearch();

        return () => {
            debouncedSearch.cancel();
        };
    }, [filterValue, setPage, setFilterValue, handleGetDataSearch]);

    return (
        <Box maxWidth={mobileScreen ? '87vw' : '100%'}>
            <Box display={'flex'} alignItems={'center'}>
                <FormatListBulleted fontSize='large' />
                <Typography variant='h4' ml={1}>Cementerios</Typography>
            </Box>

            <Box role='presentation' onClick={(e) => e.preventDefault()}>
                <Breadcrumbs maxItems={5}>
                    <LinkMUI underline='hover' color='textSecondary' display={'flex'} alignItems={'center'} component={LinkRRD} to={'/'}>
                        <Home sx={{ mr: 0.5 }} fontSize='inherit' />
                        <Typography>Menú Principal</Typography>
                    </LinkMUI>
                    <LinkMUI underline='hover' color='textPrimary' display={'flex'} alignItems={'center'} component={LinkRRD} to={'/cementerios'}>
                        <FormatListBulleted sx={{ mr: 0.5 }} fontSize='inherit' />
                        <Typography>Cementerios</Typography>
                    </LinkMUI>
                </Breadcrumbs>
            </Box>

            <Box display={'flex'} alignItems={'center'} flexWrap={'wrap'} mt={2}>
                <Button disableElevation variant='contained' color='info' startIcon={<ArrowBack />} sx={{ mr: 2, mb: 2 }} component={LinkRRD} to={'/'}>
                    <Typography variant='button'>Volver a Menú Principal</Typography>
                </Button>

                {String(decryptMessage(jwtDecode(decryptMessage(token)).role)) === '5' && (
                    <Button disableElevation color='primary' variant='contained' startIcon={<PersonAdd />} sx={{ mr: 2, mb: 2 }} onClick={() => setDialogCreate(true)}>
                        <Typography variant='button'>Nuevo cementerio</Typography>
                    </Button>
                )}

                <Button disableElevation color='primary' variant='contained' startIcon={<Replay />} sx={{ mr: 2, mb: 2 }} onClick={() => { filterValue !== '' ? handleGetDataSearch(filterValue) : handleGetData(page, rowsPerPage) }}>
                    <Typography variant='button'>Recargar cementerios</Typography>
                </Button>

                <Button disableElevation color='primary' variant='contained' startIcon={filter ? <FilterListOff /> : <FilterList />} sx={{ mr: 2, mb: 2 }} onClick={() => setFilter(!filter)}>
                    <Typography variant='button'>{filter ? 'Ocultar Filtro' : 'Mostrar Filtro'}</Typography>
                </Button>

                <Button disableElevation color='primary' variant='contained' sx={{ mb: 2 }} startIcon={rowsPerPage === 1 ? <Filter1 /> : rowsPerPage === 2 ? <Filter2 /> : rowsPerPage === 3 ? <Filter3 /> : rowsPerPage === 4 ? <Filter4 /> : rowsPerPage === 5 ? <Filter5 /> : rowsPerPage === 6 ? <Filter6 /> : rowsPerPage === 7 ? <Filter7 /> : rowsPerPage === 8 ? <Filter8 /> : rowsPerPage === 9 && <Filter9 />} id='basic-button' aria-controls={open ? 'basic-menu' : undefined} aria-haspopup="true" aria-expanded={open ? 'true' : undefined} onClick={(e) => setAnchorEl(e.currentTarget)}>
                    Filas por página
                </Button>
                <Menu id='basic-menu' anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}
                    slotProps={{
                        list: {
                            'aria-labelledby': 'basic-button',
                        },
                    }}>
                    <MenuList>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((value, index) => (
                            <MenuItem key={index} selected={rowsPerPage === value} onClick={() => handleChangeRowsPerPage(value)}>
                                <ListItemIcon>
                                    {value === 1 ? (
                                        <Filter1 />
                                    ) : value === 2 ? (
                                        <Filter2 />
                                    ) : value === 3 ? (
                                        <Filter3 />
                                    ) : value === 4 ? (
                                        <Filter4 />
                                    ) : value === 5 ? (
                                        <Filter5 />
                                    ) : value === 6 ? (
                                        <Filter6 />
                                    ) : value === 7 ? (
                                        <Filter7 />
                                    ) : value === 8 ? (
                                        <Filter8 />
                                    ) : value === 9 && (
                                        <Filter9 />
                                    )}
                                </ListItemIcon>
                                <ListItemText>{value} Filas por página</ListItemText>
                            </MenuItem>
                        ))}
                    </MenuList>
                </Menu>
            </Box>

            {filter && (
                <Box component={Paper} elevation={0} variant='outlined' p={2} display={'flex'} flexDirection={'column'} mb={2}>
                    <Alert severity='info' sx={{ mb: 2 }}>Busque por cualquier dato de la tabla <b>(Nombre, Dirección)</b></Alert>

                    <TextField fullWidth label='Filtro de leads' type='search' variant='outlined' value={filterValue} onChange={(e) => setFilterValue(e.target.value)} />
                </Box>
            )}

            {filterValue !== '' ? (
                <Fragment>
                    {dataSearchError ? (
                        <Box component={Paper} elevation={0} variant='outlined' display={'flex'} flexDirection={'column'} justifyContent={'center'} p={2}>
                            <Box display={'flex'} alignItems={'center'} mb={1}>
                                <Warning color='warning' fontSize='large' />
                                <Typography ml={1}>Error al obtener los cementerios: {dataErrorMessage}</Typography>
                            </Box>
                            <Button disableElevation variant='contained' color='primary' startIcon={<Refresh />} sx={{ width: 'fit-content' }} onClick={() => handleGetDataSearch(filterValue)}>
                                <Typography variant='button'>Consultar nuevamente</Typography>
                            </Button>
                        </Box>
                    ) : dataSearch === null ? (
                        <Box component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                            <CircularProgress />
                            <Typography ml={2}>Cargando cementerios</Typography>
                        </Box>
                    ) : (
                        <Fragment>
                            <Typography fontWeight={900} mb={2} fontSize={17} sx={{ textDecoration: 'underline' }}>Registros Actuales: {dataSearch.length}</Typography>

                            <Box component={Paper} elevation={0} variant='outlined' overflow={'auto'} m={'auto'}>
                                <TableContainer sx={{ maxHeight: '53vh' }}>
                                    <Table size='small' stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell align='center' sx={{ fontSize: 17 }}>Nombre</TableCell>
                                                <TableCell align='center' sx={{ fontSize: 17 }}>Dirección</TableCell>
                                                <TableCell align='center' sx={{ fontSize: 17 }}>Ver en Maps</TableCell>
                                                <TableCell />
                                                <TableCell />
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {dataSearch.map((value, index) => (
                                                <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 }, }}>
                                                    <TableCell align='center'>{decryptMessage(value.nombre)}</TableCell>
                                                    <TableCell align='center'>{decryptMessage(value.direccion)}</TableCell>
                                                    <TableCell align='center'>
                                                        <Button variant='text' color='primary' startIcon={<ExitToApp />} LinkComponent={'a'} href={`https://www.google.com/maps/search/${decryptMessage(value.nombre)}`} target='_blank'>
                                                            <Typography variant='button'>Ver en Google Maps</Typography>
                                                        </Button>
                                                    </TableCell>

                                                    <TableCell align='center'>
                                                        <Button disableElevation color='warning' startIcon={<Edit />} onClick={() => handleOpenDialogUpdate(value)}>
                                                            <Typography variant='button'>Editar</Typography>
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell align='center'>
                                                        <Button disableElevation color='error' startIcon={<Close />} onClick={() => handleOpenDialogDelete(value)}>
                                                            <Typography variant='button'>Eliminar</Typography>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>

                            <Pagination count={Math.ceil(dataSearch.length / rowsPerPage)} page={pageSearch} onChange={(e, value) => setPageSearch(value)} color='primary' sx={{ mt: 2, display: 'flex', justifyContent: 'center' }} />
                        </Fragment>
                    )}
                </Fragment>
            ) : (
                <Fragment>
                    {dataError ? (
                        <Box component={Paper} elevation={0} variant='outlined' display={'flex'} flexDirection={'column'} justifyContent={'center'} p={2}>
                            <Box display={'flex'} alignItems={'center'} mb={1}>
                                <Warning color='warning' fontSize='large' />
                                <Typography ml={1}>Error al obtener los cementerios: {dataErrorMessage}</Typography>
                            </Box>
                            <Button disableElevation variant='contained' color='primary' startIcon={<Refresh />} sx={{ width: 'fit-content' }} onClick={() => handleGetData(page, rowsPerPage)}>
                                <Typography variant='button'>Consultar nuevamente</Typography>
                            </Button>
                        </Box>
                    ) : data === null ? (
                        <Box component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                            <CircularProgress />
                            <Typography ml={2}>Cargando cementerios</Typography>
                        </Box>
                    ) : (
                        <Fragment>
                            <Typography fontWeight={900} mb={2} fontSize={17} sx={{ textDecoration: 'underline' }}>Registros Actuales: {data.length}</Typography>

                            <Box component={Paper} elevation={0} variant='outlined' overflow={'auto'} m={'auto'}>
                                <TableContainer sx={{ maxHeight: '53vh' }}>
                                    <Table size='small' stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell align='center' sx={{ fontSize: 17 }}>Nombre</TableCell>
                                                <TableCell align='center' sx={{ fontSize: 17 }}>Dirección</TableCell>
                                                <TableCell align='center' sx={{ fontSize: 17 }}>Ver en Maps</TableCell>
                                                <TableCell />
                                                <TableCell />
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.map((value, index) => (
                                                <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 }, }}>
                                                    <TableCell align='center'>{decryptMessage(value.nombre)}</TableCell>
                                                    <TableCell align='center'>{decryptMessage(value.direccion)}</TableCell>
                                                    <TableCell align='center'>
                                                        <Button variant='text' color='primary' startIcon={<ExitToApp />} LinkComponent={'a'} href={`https://www.google.com/maps/search/${decryptMessage(value.nombre)}`} target='_blank'>
                                                            <Typography variant='button'>Ver en Google Maps</Typography>
                                                        </Button>
                                                    </TableCell>

                                                    {String(decryptMessage(jwtDecode(decryptMessage(token)).role)) === '5' && (
                                                        <Fragment>
                                                            <TableCell align='center'>
                                                                <Button disableElevation color='warning' startIcon={<Edit />} onClick={() => handleOpenDialogUpdate(value)}>
                                                                    <Typography variant='button'>Editar</Typography>
                                                                </Button>
                                                            </TableCell>
                                                            <TableCell align='center'>
                                                                <Button disableElevation color='error' startIcon={<Close />} onClick={() => handleOpenDialogDelete(value)}>
                                                                    <Typography variant='button'>Eliminar</Typography>
                                                                </Button>
                                                            </TableCell>
                                                        </Fragment>
                                                    )}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>

                            <Pagination count={Math.ceil(count / rowsPerPage)} page={page} onChange={(e, value) => setPage(value)} color='primary' sx={{ mt: 2, display: 'flex', justifyContent: 'center' }} />
                        </Fragment>
                    )}
                </Fragment>
            )}

            <Dialog onClose={() => setDialogCreate(false)} open={dialogCreate} maxWidth='md' fullScreen={fullScreen}>
                <DialogTitle>Nuevo Cementerio</DialogTitle>
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

                    <Alert severity='info' sx={{ mb: 2 }}>La ubicación de Google Maps se mostrara en base al <b>Nombre</b> del cementerio</Alert>

                    <TextField fullWidth variant='outlined' type='text' label={<Box display={'flex'} alignItems={'center'}>
                        <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                        Nombre
                    </Box>} value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />

                    <TextField fullWidth variant='outlined' type='text' label={<Box display={'flex'} alignItems={'center'}>
                        <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                        Dirección
                    </Box>} value={direction} onChange={(e) => setDirection(e.target.value)} />
                </DialogContent>
                <DialogActions>
                    <Button variant='text' color='primary' onClick={handlePostCementerio}>
                        <Typography variant='button'>Confirmar</Typography>
                    </Button>
                    <Button variant='text' color='inherit' onClick={() => setDialogCreate(false)}>
                        <Typography variant='button'>Cerrar</Typography>
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog onClose={() => setDialogUpdate(false)} open={dialogUpdate} maxWidth='md' fullScreen={fullScreen}>
                <DialogTitle>Actualizar Cementerio</DialogTitle>
                <DialogContent>
                    {selectedData ? (
                        <Fragment>
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

                            <Alert severity='info' sx={{ mb: 2 }}>La ubicación de Google Maps se mostrara en base al <b>Nombre</b> del cementerio</Alert>

                            <TextField fullWidth variant='outlined' type='text' label={<Box display={'flex'} alignItems={'center'}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                                Nombre
                            </Box>} value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }} />

                            <TextField fullWidth variant='outlined' type='text' label={<Box display={'flex'} alignItems={'center'}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                                Dirección
                            </Box>} value={direction} onChange={(e) => setDirection(e.target.value)} />
                        </Fragment>
                    ) : (
                        <Alert severity='info'>Seleccione un cementerio para continuar</Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    {selectedData && (
                        <Button variant='text' color='primary' onClick={handlePutCementerio}>
                            <Typography variant='button'>Confirmar</Typography>
                        </Button>
                    )}

                    <Button variant='text' color='inherit' onClick={() => setDialogUpdate(false)}>
                        <Typography variant='button'>Cerrar</Typography>
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog onClose={() => setDialogDelete(false)} open={dialogDelete} maxWidth='md' fullScreen={fullScreen}>
                <DialogTitle>Eliminar Cementerio</DialogTitle>
                <DialogContent>
                    {selectedData ? (
                        <Alert severity='warning'>Esta seguro de eliminar el cementerio <b>{decryptMessage(selectedData.nombre)}</b> ubicado en <b>{decryptMessage(selectedData.direccion)}</b></Alert>
                    ) : (
                        <Alert severity='info'>Seleccione un cementerio para continuar</Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    {selectedData && (
                        <Button variant='text' color='primary' onClick={handleDeleteCementerio}>
                            <Typography variant='button'>Confirmar</Typography>
                        </Button>
                    )}

                    <Button variant='text' color='inherit' onClick={() => setDialogDelete(false)}>
                        <Typography variant='button'>Cerrar</Typography>
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
};

export default Index;
