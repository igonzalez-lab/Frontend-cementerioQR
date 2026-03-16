import React, { useState, Fragment, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, ListItemIcon, ListItemText, Menu, MenuItem, MenuList, Pagination, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Add, Close, Edit, Emergency, Filter1, Filter2, Filter3, Filter4, Filter5, Filter6, Filter7, Filter8, Filter9, FilterList, FilterListOff, Info, LibraryBooks, Refresh, Warning } from '@mui/icons-material';
import { common, grey, red } from '@mui/material/colors';

import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';
import { debounce } from 'lodash';

import { SHOW_ERROR_MESSAGE, SHOW_INFORMATION_MESSAGE, SHOW_SUCCESS_MESSAGE } from '../../slices/notificationSlice';
import { decryptMessage, encryptMessage } from '../../helpers/helpers';
import { jwtDecode } from 'jwt-decode';

const items = [{
    value: 'brit_mila',
    item: 'Brit Milá (Circuncisión)'
}, {
    value: 'bar_mitzva',
    item: 'Bar Mitzvá'
}, {
    value: 'bat_mitzva',
    item: 'Bat Mitzvá'
}, {
    value: 'jupa',
    item: 'Jupá (Bodas Judías)'
}, {
    value: 'guet',
    item: 'Guet (Dirvorcios Religiosos)'
}, {
    value: 'levaya',
    item: 'Levayá (Ceremonias de Fallecimiento)'
}];

const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        [{ 'align': [] }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'font': [] }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        ['clean']
    ],
};

const template = {
    "ops": [
        {
            "insert": "Completa la siguiente información, en donde podras escribir con detalles, incrustar imagenes, videos enbebidos y texto enriquecido:\n\n"
        },
        {
            "attributes": {
                "bold": true
            },
            "insert": "Tipo de Talit y Tefilín utilizados"
        },
        {
            "insert": " (si apica, sino borrar):"
        },
        {
            "attributes": {
                "list": "bullet"
            },
            "insert": "\n"
        },
        {
            "insert": "\n"
        },
        {
            "attributes": {
                "bold": true
            },
            "insert": "Presencia de Mikve"
        },
        {
            "insert": " (si apica, sino borrar):"
        },
        {
            "attributes": {
                "list": "bullet"
            },
            "insert": "\n"
        },
        {
            "insert": "\n"
        },
        {
            "attributes": {
                "bold": true
            },
            "insert": "Tipo de Kipá utilizada"
        },
        {
            "insert": " (si apica, sino borrar):"
        },
        {
            "attributes": {
                "list": "bullet"
            },
            "insert": "\n"
        },
        {
            "insert": "\n"
        },
        {
            "attributes": {
                "bold": true
            },
            "insert": "Melodías y Canciones especiales"
        },
        {
            "insert": " (si apica, sino borrar):"
        },
        {
            "attributes": {
                "list": "bullet"
            },
            "insert": "\n"
        },
        {
            "insert": "\n"
        },
        {
            "attributes": {
                "bold": true
            },
            "insert": "Oficiante de la ceremonia"
        },
        {
            "insert": " (si apica, sino borrar):"
        },
        {
            "attributes": {
                "list": "bullet"
            },
            "insert": "\n"
        },
        {
            "insert": "\n"
        },
        {
            "attributes": {
                "bold": true
            },
            "insert": "Testigos presentes"
        },
        {
            "insert": " (si apica, sino borrar):"
        },
        {
            "attributes": {
                "list": "bullet"
            },
            "insert": "\n"
        }
    ]
};

const Actividades = ({ people, viewOnly }) => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const containerRef = useRef(null);
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const token = useSelector((state) => state.user_cementerio_qr.data);

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const [width, setWidth] = useState(0);
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState(false);

    const [dialogCreate, setDialogCreate] = useState(false);
    const [dialogUpdate, setDialogUpdate] = useState(false);
    const [dialogDelete, setDialogDelete] = useState(false);
    const [dialogDetail, setDialogDetail] = useState(false);

    const [tipoActividad, setTipoActividad] = useState('');
    const [descripcionActividad, setDescripcionActividad] = useState({});

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
    const [selectedData, setSelectedData] = useState(null);

    const [count, setCount] = useState(null);
    const [rowsPerPage, setRowsPerPage] = useState(7);

    const handleGetData = useCallback(async (page, rows, id) => {
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

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/traditions/${page}/${rows}/${id}/NO`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setData(responseJson.message);
            console.log(responseJson.message);

            setDataError(false);
            setDataErrorMessage('');
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));

            setData(null);
            setDataError(true);
            setDataErrorMessage(error.message);
        }
    }, [token, setData, dispatch, setDataError, decryptMessage, setDataErrorMessage]);

    const handleGetDataCount = useCallback(async (id) => {
        try {
            setCount(null);

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestOptions = {
                method: 'GET',
                headers: requestHeader,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/traditions/count/${id}/NO`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setCount(responseJson.message);
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [token, setCount, dispatch, decryptMessage]);

    const handleGetDataSearch = useCallback(async (value, id) => {
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

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/traditions/param/${value}/${id}/NO`, requestOptions);
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

    const handlePostData = useCallback(async () => {
        try {
            setLoading(true);
            dispatch(SHOW_INFORMATION_MESSAGE('Procesando, espere por favor'));

            if (tipoActividad === '') {
                throw new Error('Complete el Tipo de Actividad');
            }

            if (descripcionActividad === '') {
                throw new Error('Complete la Descripcion de Actividad');
            }

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'people_id': encryptMessage(String(people.id)),
                'festividad': encryptMessage('NO'),
                'tradition_type': encryptMessage(tipoActividad),
                'tradition_description': encryptMessage(JSON.stringify(descripcionActividad))
            });

            const requestOptions = {
                method: 'POST',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/traditions/`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setTipoActividad('');
            setDescripcionActividad(template);

            setLoading(false);
            setDialogCreate(false);
            dispatch(SHOW_SUCCESS_MESSAGE(responseJson.message));

            if (filterValue === '') {
                await handleGetData(page, rowsPerPage, people.id);
            } else {
                await handleGetDataSearch(filterValue, people.id);
            }
        }
        catch (error) {
            setLoading(false);
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [people, token, page, rowsPerPage, filterValue, template, tipoActividad, descripcionActividad, dispatch, setLoading, handleGetData, setTipoActividad, encryptMessage, decryptMessage, setDialogCreate, handleGetDataSearch, setDescripcionActividad]);

    const handlePutData = useCallback(async () => {
        try {
            dispatch(SHOW_INFORMATION_MESSAGE('Procesando, espere por favor'));

            if (tipoActividad === '') {
                throw new Error('Complete el Tipo de Actividad');
            }

            if (descripcionActividad === '') {
                throw new Error('Complete la Descripcion de Actividad');
            }

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'people_id': encryptMessage(String(people.id)),
                'tradition_id': encryptMessage(String(selectedData.id)),
                'tradition_type': encryptMessage(tipoActividad),
                'tradition_description': encryptMessage(JSON.stringify(descripcionActividad))
            });

            const requestOptions = {
                method: 'PUT',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/traditions/`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setTipoActividad('');
            setDescripcionActividad(template);

            setLoading(false);
            setDialogUpdate(false);
            dispatch(SHOW_SUCCESS_MESSAGE(responseJson.message));

            if (filterValue === '') {
                await handleGetData(page, rowsPerPage, people.id);
            } else {
                await handleGetDataSearch(filterValue, people.id);
            }
        }
        catch (error) {
            setLoading(false);
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [people, token, page, rowsPerPage, filterValue, template, selectedData, tipoActividad, descripcionActividad, dispatch, setLoading, handleGetData, setTipoActividad, encryptMessage, decryptMessage, setDialogUpdate, handleGetDataSearch, setDescripcionActividad]);

    const handleDeleteData = useCallback(async () => {
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

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/traditions/`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            dispatch(SHOW_SUCCESS_MESSAGE(responseJson.message));
            setDialogDelete(false);

            if (filterValue === '') {
                await handleGetData(page, rowsPerPage, people.id);
            } else {
                await handleGetDataSearch(filterValue, people.id);
            }
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [people, token, page, rowsPerPage, filterValue, selectedData, dispatch, handleGetData, setDialogDelete, encryptMessage, decryptMessage, handleGetDataSearch]);

    const handleChangeRowsPerPage = useCallback((payload) => {
        setRowsPerPage(payload);
        setAnchorEl(null);
    }, [setRowsPerPage, setAnchorEl]);

    const handleOpenDialogCreate = useCallback(() => {
        setDialogCreate(true);
        setDescripcionActividad(template);
    }, [template, setDialogCreate, setDescripcionActividad]);

    const handleOpenDialogUpdate = useCallback(async (payload) => {
        setDialogUpdate(true);
        setSelectedData(payload);
        setTipoActividad(decryptMessage(payload.tipo_tradicion));
        setDescripcionActividad(JSON.parse(decryptMessage(payload.descripcion_tradicion)));
    }, [setDialogUpdate, setSelectedData, setTipoActividad, setDescripcionActividad]);

    const handleOpenDialogDelete = useCallback((payload) => {
        setSelectedData(payload);
        setDialogDelete(true);
    }, [setSelectedData, setDialogDelete]);

    const handleOpenDialogDetail = useCallback((payload) => {
        setSelectedData(payload);

        setDialogDetail(true);
    }, [setSelectedData, setDialogDetail]);

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setWidth(containerRef.current.offsetWidth);
            }
        };

        updateWidth();

        const resizeObserver = new ResizeObserver(() => updateWidth());

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, [containerRef]);

    useEffect(() => {
        if (!filterValue) {
            setPage(1);
            setFilterValue('');
            return;
        }

        const debouncedSearch = debounce(async () => {
            await handleGetDataSearch(filterValue, people.id);
        }, 400);

        debouncedSearch();

        return () => {
            debouncedSearch.cancel();
        };
    }, [people, filterValue, setPage, setFilterValue, handleGetDataSearch]);

    useEffect(() => {
        handleGetDataCount(people.id);
        handleGetData(page, rowsPerPage, people.id);
    }, [people, page, rowsPerPage, handleGetData, handleGetDataCount]);

    return (
        <Box>
            <Box display={'flex'} alignItems={'center'} flexWrap={'wrap'}>
                {!viewOnly && (
                    String(decryptMessage(jwtDecode(decryptMessage(token)).role)) === '5' && (
                        <Fragment>
                            <Button disableElevation color='primary' variant='contained' startIcon={<Add />} sx={{ mr: 2, mb: 2 }} onClick={handleOpenDialogCreate}>
                                <Typography variant='button'>Crear Actividad</Typography>
                            </Button>

                            <Button disableElevation color='primary' variant='contained' startIcon={<Refresh />} sx={{ mr: 2, mb: 2 }} onClick={() => { filterValue !== '' ? handleGetDataSearch(filterValue, people.id) : handleGetData(page, rowsPerPage, people.id) }}>
                                <Typography variant='button'>Recargar Actividades</Typography>
                            </Button>
                        </Fragment>
                    )
                )}

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
                <TextField fullWidth variant='outlined' label='Filtro universal' value={filterValue} onChange={(e) => setFilterValue(e.target.value)} sx={{ mb: 2 }} />
            )}

            {filterValue !== '' ? (
                <Fragment>
                    {dataSearchError ? (
                        <Box mt={2} component={Paper} elevation={0} variant='outlined' display={'flex'} flexDirection={'column'} justifyContent={'center'} p={2}>
                            <Box display={'flex'} alignItems={'center'} mb={1}>
                                <Warning color='warning' fontSize='large' />
                                <Typography ml={1}>Error al obtener los datos: {dataSearchErrorMessage}</Typography>
                            </Box>
                            <Button disableElevation variant='contained' color='primary' startIcon={<Refresh />} sx={{ width: 'fit-content' }} onClick={() => handleGetDataSearch(filterValue, people.id)}>
                                <Typography variant='button'>Consultar nuevamente</Typography>
                            </Button>
                        </Box>
                    ) : dataSearch === null ? (
                        <Box mt={2} component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                            <CircularProgress />
                            <Typography ml={2}>Cargando datos</Typography>
                        </Box>
                    ) : (
                        <Fragment>
                            <Typography fontWeight={900} mb={2} fontSize={17} sx={{ textDecoration: 'underline' }}>Registros Actuales: {dataSearch.length}</Typography>

                            <Box component={Paper} elevation={0} variant='outlined' overflow={'auto'} m={'auto'}>
                                <TableContainer sx={{ maxHeight: '53vh' }}>
                                    <Table size='small' stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell align='center' sx={{ fontSize: 17 }}>Tipo de Tradición</TableCell>
                                                <TableCell />

                                                {!viewOnly && (
                                                    <Fragment>
                                                        <TableCell />
                                                        <TableCell />
                                                    </Fragment>
                                                )}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {dataSearch.map((value, index) => (
                                                <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 }, }}>
                                                    <TableCell align='center'>{items.filter(x => String(x.value) === String(decryptMessage(value.tipo_tradicion)))[0].item}</TableCell>
                                                    <TableCell align='center'>
                                                        <Button disableElevation color='primary' startIcon={<LibraryBooks />} onClick={() => handleOpenDialogDetail(value)}>
                                                            <Typography variant='button'>Ver detalles</Typography>
                                                        </Button>
                                                    </TableCell>
                                                    {!viewOnly && (
                                                        String(decryptMessage(jwtDecode(decryptMessage(token)).role)) === '5' && (
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
                                                        )
                                                    )}
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
                                <Typography ml={1}>Error al obtener los datos: {dataErrorMessage}</Typography>
                            </Box>
                            <Button disableElevation variant='contained' color='primary' startIcon={<Refresh />} sx={{ width: 'fit-content' }} onClick={() => handleGetData(page, rowsPerPage, people.id)}>
                                <Typography variant='button'>Consultar nuevamente</Typography>
                            </Button>
                        </Box>
                    ) : data === null ? (
                        <Box component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                            <CircularProgress />
                            <Typography ml={2}>Cargando datos</Typography>
                        </Box>
                    ) : (
                        <Fragment>
                            <Typography fontWeight={900} mb={2} fontSize={17} sx={{ textDecoration: 'underline' }}>Registros Actuales: {data.length}</Typography>

                            <Box component={Paper} elevation={0} variant='outlined' overflow={'auto'} m={'auto'}>
                                <TableContainer sx={{ maxHeight: '53vh' }}>
                                    <Table size='small' stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell align='center' sx={{ fontSize: 17 }}>Tipo de Tradición</TableCell>
                                                <TableCell />

                                                {!viewOnly && (
                                                    <Fragment>
                                                        <TableCell />
                                                        <TableCell />
                                                    </Fragment>
                                                )}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.map((value, index) => (
                                                <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 }, }}>
                                                    <TableCell align='center'>{items.filter(x => String(x.value) === String(decryptMessage(value.tipo_tradicion)))[0].item}</TableCell>
                                                    <TableCell align='center'>
                                                        <Button disableElevation color='primary' startIcon={<LibraryBooks />} onClick={() => handleOpenDialogDetail(value)}>
                                                            <Typography variant='button'>Ver detalles</Typography>
                                                        </Button>
                                                    </TableCell>

                                                    {!viewOnly && (
                                                        String(decryptMessage(jwtDecode(decryptMessage(token)).role)) === '5' && (
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
                                                        )
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

            <Dialog open={dialogCreate} onClose={() => setDialogCreate(false)} maxWidth='md' fullScreen={fullScreen}>
                <DialogTitle>Crear Nueva Actividad</DialogTitle>

                <DialogContent>
                    <Box component={Paper} elevation={0} variant='outlined' bgcolor={grey['300']} p={2} display={'flex'} alignItems={'center'} mb={2}>
                        <Info color='action' />
                        <Typography color='textSecondary' ml={2}>Completa los campos para ingresar la actividad, los detalles de esta, deberás ingresarlas en el editor de texto enriquecido.</Typography>
                    </Box>

                    <Box component={Paper} elevation={0} variant='outlined' bgcolor={red['100']} p={2} display={'flex'} alignItems={'center'} mb={2}>
                        <Emergency color='error' />
                        <Typography color='error' ml={2}>Obligatorio.</Typography>
                    </Box>

                    <FormControl fullWidth disabled={loading} sx={{ mb: 2 }}>
                        <InputLabel id='select-tipo-label' sx={{ display: 'flex', alignItems: 'center' }}>
                            <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                            Tipo de actividad
                        </InputLabel>
                        <Select labelId='select-tipo-label' id='select-tipo' disabled={loading} value={tipoActividad} label='*** Tipo de actividad' onChange={(e) => setTipoActividad(e.target.value)}>
                            <MenuItem value={''}>Seleccione una opción</MenuItem>

                            {items.map((value, index) => (
                                <MenuItem key={index} value={value.value}>{value.item}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth disabled={loading}>
                        <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focused ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                            <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                            Descripción del Contenido
                        </InputLabel>

                        <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                            <ReactQuill
                                value={descripcionActividad}
                                onChange={(content, delta, source, editor) => setDescripcionActividad(editor.getContents())}
                                modules={modules}
                                theme='snow'
                                placeholder='Escribe algo...'
                                style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                                className='rounded'
                                readOnly={loading}
                            />
                        </Box>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button color='inherit' onClick={() => setDialogCreate(false)}>
                        <Typography variant='button'>Cerrar</Typography>
                    </Button>
                    <Button color='primary' onClick={handlePostData}>
                        <Typography variant='button'>Crear</Typography>
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={dialogUpdate} onClose={() => setDialogUpdate(false)} maxWidth='md' fullScreen={fullScreen}>
                <DialogTitle>Editar Actividad</DialogTitle>

                {selectedData === null ? (
                    <Box component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                        <Warning fontSize='large' color='warning' />
                        <Typography ml={2}>Seleccione una tradición para continuar</Typography>
                    </Box>
                ) : (
                    <Fragment>
                        <DialogContent>
                            <Box component={Paper} elevation={0} variant='outlined' bgcolor={grey['300']} p={2} display={'flex'} alignItems={'center'} mb={2}>
                                <Info color='action' />
                                <Typography color='textSecondary' ml={2}>Completa los campos para ingresar la actividad, los detalles de esta, deberás ingresarlas en el editor de texto enriquecido.</Typography>
                            </Box>

                            <Box component={Paper} elevation={0} variant='outlined' bgcolor={red['100']} p={2} display={'flex'} alignItems={'center'} mb={2}>
                                <Emergency color='error' />
                                <Typography color='error' ml={2}>Obligatorio.</Typography>
                            </Box>

                            <FormControl fullWidth disabled={loading} sx={{ mb: 2 }}>
                                <InputLabel id='select-tipo-label' sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                                    Tipo de actividad
                                </InputLabel>
                                <Select labelId='select-tipo-label' id='select-tipo' disabled={loading} value={tipoActividad} label='*** Tipo de actividad' onChange={(e) => setTipoActividad(e.target.value)}>
                                    <MenuItem value={''}>Seleccione una opción</MenuItem>

                                    {items.map((value, index) => (
                                        <MenuItem key={index} value={value.value}>{value.item}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth disabled={loading}>
                                <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focused ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                    <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                    Descripción del Contenido
                                </InputLabel>

                                <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                    <ReactQuill
                                        value={descripcionActividad}
                                        onChange={(content, delta, source, editor) => setDescripcionActividad(editor.getContents())}
                                        modules={modules}
                                        theme='snow'
                                        placeholder='Escribe algo...'
                                        style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                        onFocus={() => setFocused(true)}
                                        onBlur={() => setFocused(false)}
                                        className='rounded'
                                        readOnly={loading}
                                    />
                                </Box>
                            </FormControl>
                        </DialogContent>
                        <DialogActions>
                            <Button color='inherit' onClick={() => setDialogCreate(false)}>
                                <Typography variant='button'>Cerrar</Typography>
                            </Button>
                            <Button color='primary' onClick={handlePutData}>
                                <Typography variant='button'>Editar</Typography>
                            </Button>
                        </DialogActions>
                    </Fragment>
                )}
            </Dialog>

            <Dialog open={dialogDelete} onClose={() => setDialogDelete(false)} maxWidth='md' fullScreen={fullScreen}>
                <DialogTitle>Eliminar Actividad</DialogTitle>
                <DialogContent>
                    {selectedData === null ? (
                        <Box component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                            <Warning fontSize='large' color='warning' />
                            <Typography ml={2}>Seleccione una actividad para continuar</Typography>
                        </Box>
                    ) : (
                        <Fragment>
                            <Typography textAlign={'justify'}>¿Esta seguro de eliminar la actividad <b>{items.filter(x => String(x.value) === String(decryptMessage(selectedData.tipo_tradicion)))[0].item}</b> del sistema?, una vez eliminada deberá crearla nuevamente si desea restablecerla.</Typography>
                            <Typography textAlign={'justify'} mt={2}>Si está de acuerdo, pulse <Typography variant='button' color='primary'>CONFIRMAR</Typography>. Si no es así, pulse <Typography variant='button' color='textPrimary'>CERRAR</Typography>.</Typography>
                        </Fragment>
                    )}
                </DialogContent>
                <DialogActions>
                    {selectedData !== null && (
                        <Button variant='text' color='primary' onClick={handleDeleteData}>
                            <Typography variant='button'>Confirmar</Typography>
                        </Button>
                    )}

                    <Button variant='text' color='inherit' onClick={() => setDialogDelete(false)}>
                        <Typography variant='button'>Cerrar</Typography>
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={dialogDetail} onClose={() => setDialogDetail(false)} maxWidth='md' fullScreen={fullScreen}>
                <DialogTitle>Detalles de la Tradición</DialogTitle>
                <DialogContent>
                    {selectedData === null ? (
                        <Box component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                            <Warning fontSize='large' color='warning' />
                            <Typography ml={2}>Seleccione una tradición para continuar</Typography>
                        </Box>
                    ) : (
                        <Fragment>
                            <Box component={Paper} elevation={0} variant='outlined' overflow={'auto'} m={'auto'}>
                                <TableContainer>
                                    <Table>
                                        <TableBody>
                                            <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 }, }}>
                                                <TableCell sx={{ fontWeight: 900, bgcolor: grey['100'] }}>Tipo de Tradición</TableCell>
                                                <TableCell>{items.filter(x => String(x.value) === String(decryptMessage(selectedData.tipo_tradicion)))[0].item}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>

                            <Box component={Paper} elevation={0} variant='outlined' overflow={'auto'} m={'auto'} mt={2}>
                                <TableContainer>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 900, bgcolor: grey['100'] }}>Descripción de la Tradición</TableCell>
                                            </TableRow>
                                            <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 }, }}>
                                                <ReactQuill
                                                    value={JSON.parse(decryptMessage(selectedData.descripcion_tradicion))}
                                                    theme={null}
                                                    className='rounded'
                                                    readOnly
                                                />
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Fragment>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button variant='text' color='inherit' onClick={() => setDialogDetail(false)}>
                        <Typography variant='button'>Cerrar</Typography>
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
};

export default Actividades;
