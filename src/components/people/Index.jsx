import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as LinkRRD } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';

import { Box, Breadcrumbs, Typography, useMediaQuery, useTheme, Link as LinkMUI, Avatar, Button, TextField, Paper, CircularProgress, TableContainer, Table, TableHead, TableRow, TableCell, Pagination, TableBody, Dialog, DialogTitle, DialogContent, DialogActions, Accordion, AccordionSummary, Tooltip, AccordionDetails, InputAdornment, Collapse, Alert, IconButton, List, ListItem, ListItemIcon, ListItemText, Menu, MenuList, MenuItem } from '@mui/material';
import { CheckCircle, Close, Edit, ExpandMore, FilterList, FilterListOff, Home, ManageAccounts, People, PersonAdd, Refresh, Replay, Warning, Error as ErrorIcon, Emergency, InsertDriveFile, Visibility, Delete, Image, ArrowBack, Filter1, Filter2, Filter3, Filter4, Filter5, Filter6, Filter7, Filter8, Filter9 } from '@mui/icons-material';
import { blue } from '@mui/material/colors';


import { SHOW_ERROR_MESSAGE, SHOW_SUCCESS_MESSAGE } from '../../slices/notificationSlice';
import { decryptMessage, encryptMessage } from '../../helpers/helpers';
import { jwtDecode } from 'jwt-decode';
import { debounce } from 'lodash';
import { HDate } from '@hebcal/core';

const hebrewMonthNamesES = {
    1: 'Nisán',
    2: 'Iyar',
    3: 'Siván',
    4: 'Tamuz',
    5: 'Av',
    6: 'Elul',
    7: 'Tishrei',
    8: 'Marjeshván',
    9: 'Kislev',
    10: 'Tevet',
    11: 'Shevat',
    12: 'Adar',
    13: 'Adar II'
};

const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],  // Encabezados
        ['bold', 'italic', 'underline', 'strike'], // Negrita, cursiva, subrayado, tachado
        [{ 'list': 'ordered' }, { 'list': 'bullet' }], // Listas ordenadas y sin orden
        ['blockquote', 'code-block'], // Citas y bloques de código
        ['link', 'image', 'video'], // Enlaces, imágenes y vídeos
        [{ 'align': [] }], // Alineación
        [{ 'color': [] }, { 'background': [] }], // Colores de texto y fondo
        [{ 'font': [] }], // Tipos de letra
        [{ 'script': 'sub' }, { 'script': 'super' }], // Subíndice, superíndice
        [{ 'indent': '-1' }, { 'indent': '+1' }], // Indentación
        ['clean'] // Limpiar formato
    ],
};

const Index = () => {
    const setPeopleRef = useRef(true);

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

    const [hebrewFullname, setHebrewFullname] = useState('');
    const [yiddishFullname, setYiddishFullname] = useState('');
    const [spanishFullname, setSpanishFullname] = useState('');

    const [hebrewBirthDate, setHebrewBirthDate] = useState('');
    const [gregorianBirthDate, setGregorianBirthDate] = useState('');

    const [cityBirth, setCityBirth] = useState('');
    const [regionBirth, setRegionBirth] = useState('');
    const [countryBirth, setCountryBirth] = useState('');

    const [hebrewDeathDate, setHebrewDeathDate] = useState('');
    const [gregorianDeathDate, setGregorianDeathDate] = useState('');

    const [files, setFiles] = useState([]);
    const [deltaContent, setDeltaContent] = useState({});


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

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/people/param/${value}`, requestOptions);
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

    const handleGetFilesById = useCallback(async (id) => {
        try {
            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestOptions = {
                method: 'GET',
                headers: requestHeader,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/people/files/${id}`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            return responseJson.message;
        }
        catch (error) {
            return null;
        }
    }, [token]);

    const handlePostPeople = useCallback(async () => {
        try {
            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'spanish_name': encryptMessage(spanishFullname.trim()),
                'yiddish_name': encryptMessage(yiddishFullname.trim()),
                'hebrew_name': encryptMessage(hebrewFullname.trim()),
                'gregorian_birth_date': encryptMessage(gregorianBirthDate.trim()),
                'hebrew_birth_date': encryptMessage(hebrewBirthDate.trim()),
                'gregorian_death_date': encryptMessage(gregorianDeathDate.trim()),
                'hebrew_death_date': encryptMessage(hebrewDeathDate.trim()),
                'country': encryptMessage(countryBirth.trim()),
                'city': encryptMessage(cityBirth.trim()),
                'region': encryptMessage(regionBirth.trim()),
                'biography': encryptMessage(JSON.stringify(deltaContent)),
                'files': encryptMessage(JSON.stringify(files)),
            });

            const requestOptions = {
                method: 'POST',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/people/`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setSpanishFullname('');
            setYiddishFullname('');
            setHebrewFullname('');
            setGregorianBirthDate('');
            setHebrewBirthDate('');
            setGregorianDeathDate('');
            setHebrewDeathDate('');
            setCountryBirth('');
            setCityBirth('');
            setRegionBirth('');
            setDeltaContent({});
            setFiles([]);

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
    }, [token, page, rowsPerPage, filterValue, spanishFullname, yiddishFullname, hebrewFullname, gregorianBirthDate, hebrewBirthDate, gregorianDeathDate, hebrewDeathDate, countryBirth, cityBirth, regionBirth, deltaContent, files, handleGetData, handleGetDataSearch]);

    const handlePutPeople = useCallback(async () => {
        try {
            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'people_id': encryptMessage(String(selectedData.id)),
                'spanish_name': encryptMessage(spanishFullname.trim()),
                'yiddish_name': encryptMessage(yiddishFullname.trim()),
                'hebrew_name': encryptMessage(hebrewFullname.trim()),
                'gregorian_birth_date': encryptMessage(gregorianBirthDate.trim()),
                'hebrew_birth_date': encryptMessage(hebrewBirthDate.trim()),
                'gregorian_death_date': encryptMessage(gregorianDeathDate.trim()),
                'hebrew_death_date': encryptMessage(hebrewDeathDate.trim()),
                'country': encryptMessage(countryBirth.trim()),
                'city': encryptMessage(cityBirth.trim()),
                'region': encryptMessage(regionBirth.trim()),
                'biography': encryptMessage(JSON.stringify(deltaContent)),
                'files': encryptMessage(JSON.stringify(files)),
            });

            const requestOptions = {
                method: 'PUT',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/people/`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setSpanishFullname('');
            setYiddishFullname('');
            setHebrewFullname('');
            setGregorianBirthDate('');
            setHebrewBirthDate('');
            setGregorianDeathDate('');
            setHebrewDeathDate('');
            setCountryBirth('');
            setCityBirth('');
            setRegionBirth('');
            setDeltaContent({});
            setFiles([]);

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
    }, [token, page, rowsPerPage, filterValue, selectedData, spanishFullname, yiddishFullname, hebrewFullname, gregorianBirthDate, hebrewBirthDate, gregorianDeathDate, hebrewDeathDate, countryBirth, cityBirth, regionBirth, deltaContent, files, handleGetData, handleGetDataSearch]);

    const handleDeletePeople = useCallback(async () => {
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

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/people/`, requestOptions);
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


    const base64ToBlob = useCallback((payload) => {
        const parts = payload.split(',');
        const mime = parts[0].match(/:(.*?);/)[1];
        const bstr = atob(parts[1]);

        let n = bstr.length;
        const u8arr = new Uint8Array(n);

        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new Blob([u8arr], { type: mime });
    }, []);

    const handleOpenDialogDelete = useCallback((payload) => {
        setSelectedData(payload);
        setDialogDelete(true);
    }, [setSelectedData, setDialogDelete]);

    const handleOpenDialogUpdate = useCallback(async (payload) => {
        setDialogUpdate(true);
        setSelectedData(payload);

        setSpanishFullname(decryptMessage(payload.nombre_espanol));
        setYiddishFullname(decryptMessage(payload.nombre_yiddish));
        setHebrewFullname(decryptMessage(payload.nombre_hebreo));
        setHebrewBirthDate(decryptMessage(payload.fecha_nacimiento_hebreo));
        setGregorianBirthDate(decryptMessage(payload.fecha_nacimiento_gregoriano));
        setCityBirth(decryptMessage(payload.ciudad));
        setRegionBirth(decryptMessage(payload.region));
        setCountryBirth(decryptMessage(payload.pais));
        setHebrewDeathDate(decryptMessage(payload.fecha_muerte_hebreo));
        setGregorianDeathDate(decryptMessage(payload.fecha_muerte_gregoriano));
        setDeltaContent(JSON.parse(decryptMessage(payload.biografia)));

        const newFiles = [];
        const filesResponse = await handleGetFilesById(payload.id);

        filesResponse.map((value, index) => {
            const blob = base64ToBlob(`data:image/png;base64,${value.base64}`);
            const url = URL.createObjectURL(blob);

            newFiles.push({
                id: value.id,
                name: decryptMessage(value.nombre),
                url: url,
                base64: `data:image/png;base64,${value.base64}`
            });
        });

        setFiles(newFiles);
    }, [setSelectedData, setDialogUpdate, setSpanishFullname, setYiddishFullname, setHebrewFullname, setHebrewBirthDate, setGregorianBirthDate, setCityBirth, setRegionBirth, setCountryBirth, setGregorianDeathDate, setHebrewDeathDate, setDeltaContent, setFiles, decryptMessage, base64ToBlob, handleGetFilesById]);

    const gregorianToHebrew = useCallback((dateString) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const jsDate = new Date(year, month - 1, day);
        const hdate = new HDate(jsDate);

        const dia = hdate.getDate();
        const mes = hdate.getMonth();
        const anio = hdate.getFullYear();

        const mesES = hebrewMonthNamesES[mes] || mes;
        return `${dia} de ${mesES} de ${anio}`;
    }, []);

    const translateLanguages = useCallback(async (text, origin, destiny) => {
        if (!text.trim()) return '';

        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(origin)}&tl=${encodeURIComponent(destiny)}&dt=t&q=${encodeURIComponent(text)}`;
            const response = await fetch(url);
            const responseData = await response.json();

            return responseData[0][0][0];
        } catch (e) {
            console.error('Error al traducir:', e);
            return text;
        }
    }, []);

    const debouncedTranslateHebrew = useCallback(
        debounce(async (value) => {
            const result = await translateLanguages(value, 'es', 'he');
            setHebrewFullname(result);
        }, 500),
        [translateLanguages, setHebrewFullname]
    );

    const debouncedTranslateYiddish = useCallback(
        debounce(async (value) => {
            const result = await translateLanguages(value, 'es', 'yi');
            setYiddishFullname(result);
        }, 500),
        [translateLanguages, setYiddishFullname]
    );

    const handleChangeRowsPerPage = useCallback((payload) => {
        setRowsPerPage(payload);
        setAnchorEl(null);
    }, [setRowsPerPage, setAnchorEl]);


    useEffect(() => {
        debouncedTranslateHebrew(spanishFullname);
        debouncedTranslateYiddish(spanishFullname);
    }, [spanishFullname, debouncedTranslateHebrew, debouncedTranslateYiddish]);

    useEffect(() => {
        if (gregorianBirthDate !== '') {
            setHebrewBirthDate(gregorianToHebrew(gregorianBirthDate));
        }
    }, [gregorianBirthDate, gregorianToHebrew, setHebrewBirthDate]);

    useEffect(() => {
        if (gregorianDeathDate !== '') {
            setHebrewDeathDate(gregorianToHebrew(gregorianDeathDate));
        }
    }, [gregorianDeathDate, gregorianToHebrew, setHebrewDeathDate]);

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

    useEffect(() => {
        if (setPeopleRef.current === true) {
            if (data !== null) {
                if (String(decryptMessage(jwtDecode(decryptMessage(token)).role)) === '2') {
                    const ids = JSON.parse(decryptMessage(decryptMessage(jwtDecode(decryptMessage(token)).personas)));
                    const filtered = data.filter(item => ids.includes(String(item.id)));
                    setData(filtered);

                    setPeopleRef.current = false;
                }
            }
        }
    }, [data, token, setPeopleRef, setData, jwtDecode, decryptMessage]);

    return (
        <Box maxWidth={mobileScreen ? '87vw' : '100%'}>
            <Box display={'flex'} alignItems={'center'}>
                <People fontSize='large' />
                <Typography variant='h4' ml={1}>Personas</Typography>
            </Box>

            <Box role='presentation' onClick={(e) => e.preventDefault()}>
                <Breadcrumbs maxItems={5}>
                    <LinkMUI underline='hover' color='textSecondary' display={'flex'} alignItems={'center'} component={LinkRRD} to={'/'}>
                        <Home sx={{ mr: 0.5 }} fontSize='inherit' />
                        <Typography>Menú Principal</Typography>
                    </LinkMUI>
                    <LinkMUI underline='hover' color='textPrimary' display={'flex'} alignItems={'center'} component={LinkRRD} to={'/personas'}>
                        <People sx={{ mr: 0.5 }} fontSize='inherit' />
                        <Typography>Personas</Typography>
                    </LinkMUI>
                </Breadcrumbs>
            </Box>

            <Box display={'flex'} alignItems={'center'} flexWrap={'wrap'} mt={2}>
                <Button disableElevation variant='contained' color='info' startIcon={<ArrowBack />} sx={{ mr: 2, mb: 2 }} component={LinkRRD} to={'/'}>
                    <Typography variant='button'>Volver a Menú Principal</Typography>
                </Button>

                <Button disableElevation color='primary' variant='contained' startIcon={<PersonAdd />} sx={{ mr: 2, mb: 2 }} onClick={() => setDialogCreate(true)}>
                    <Typography variant='button'>Nueva Persona</Typography>
                </Button>

                <Button disableElevation color='primary' variant='contained' startIcon={<Replay />} sx={{ mr: 2, mb: 2 }} onClick={() => { filterValue !== '' ? handleGetDataSearch(filterValue) : handleGetData(page, rowsPerPage) }}>
                    <Typography variant='button'>Recargar Personas</Typography>
                </Button>

                <Button disableElevation color='primary' variant='contained' startIcon={filter ? <FilterListOff /> : <FilterList />} sx={{ mr: 2, mb: 2 }} onClick={() => setFilter(!filter)}>
                    <Typography variant='button'>{filter ? 'Ocultar Filtro' : 'Filtrar Personas'}</Typography>
                </Button>

                <Button disableElevation color='primary' variant='contained' sx={{ mb: 2 }} startIcon={rowsPerPage === 1 ? <Filter1 /> : rowsPerPage === 2 ? <Filter2 /> : rowsPerPage === 3 ? <Filter3 /> : rowsPerPage === 4 ? <Filter4 /> : rowsPerPage === 5 ? <Filter5 /> : rowsPerPage === 6 ? <Filter6 /> : rowsPerPage === 7 ? <Filter7 /> : rowsPerPage === 8 ? <Filter8 /> : rowsPerPage === 9 && <Filter9 />} id='basic-button' aria-controls={open ? 'basic-menu' : undefined} aria-haspopup='true' aria-expanded={open ? 'true' : undefined} onClick={(e) => setAnchorEl(e.currentTarget)}>
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
                                <Typography ml={1}>Error al obtener las personas: {dataSearchErrorMessage}</Typography>
                            </Box>
                            <Button disableElevation variant='contained' color='primary' startIcon={<Refresh />} sx={{ width: 'fit-content' }} onClick={() => handleGetDataSearch(filterValue)}>
                                <Typography variant='button'>Consultar nuevamente</Typography>
                            </Button>
                        </Box>
                    ) : dataSearch === null ? (
                        <Box mt={2} component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                            <CircularProgress />
                            <Typography ml={2}>Cargando personas</Typography>
                        </Box>
                    ) : (
                        <Fragment>
                            <Typography fontWeight={900} mb={2} fontSize={17} sx={{ textDecoration: 'underline' }}>Registros Actuales: {dataSearch.length}</Typography>

                            <Box component={Paper} elevation={0} variant='outlined' overflow={'auto'} m={'auto'}>
                                <TableContainer sx={{ maxHeight: '53vh' }}>
                                    <Table size='small' stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell align='center' colSpan={3} sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Nombres</TableCell>
                                                <TableCell align='center' colSpan={4} sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Fecha y Lugar de Nacimiento</TableCell>
                                                <TableCell align='center' colSpan={2} sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Fecha de Fallecimiento</TableCell>
                                                <TableCell align='center' sx={{ fontSize: 17, borderBottom: 0 }} />
                                                <TableCell align='center' sx={{ fontSize: 17, borderBottom: 0 }} />
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
                                                <TableCell />
                                                <TableCell />
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {dataSearch.map((value, index) => (
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
                                                        <Button disableElevation color='primary' startIcon={<ManageAccounts />} onClick={() => navigate('/personas/detalle', { state: { people: value } })}>
                                                            <Typography variant='button'>Administrar</Typography>
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
                        <Box mt={2} component={Paper} elevation={0} variant='outlined' display={'flex'} flexDirection={'column'} justifyContent={'center'} p={2}>
                            <Box display={'flex'} alignItems={'center'} mb={1}>
                                <Warning color='warning' fontSize='large' />
                                <Typography ml={1}>Error al obtener las personas: {dataErrorMessage}</Typography>
                            </Box>
                            <Button disableElevation variant='contained' color='primary' startIcon={<Refresh />} sx={{ width: 'fit-content' }} onClick={() => handleGetData(page, rowsPerPage)}>
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
                            <Typography fontWeight={900} mb={2} fontSize={17} sx={{ textDecoration: 'underline' }}>Registros Actuales: {data.length}</Typography>

                            <Box component={Paper} elevation={0} variant='outlined' overflow={'auto'} m={'auto'}>
                                <TableContainer sx={{ maxHeight: '53vh' }}>
                                    <Table size='small' stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell align='center' colSpan={3} sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Nombres</TableCell>
                                                <TableCell align='center' colSpan={4} sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Fecha y Lugar de Nacimiento</TableCell>
                                                <TableCell align='center' colSpan={2} sx={{ fontSize: 17, borderRight: 1, borderRightColor: 'divider' }}>Fecha de Fallecimiento</TableCell>
                                                <TableCell align='center' sx={{ fontSize: 17, borderBottom: 0 }} />
                                                <TableCell align='center' sx={{ fontSize: 17, borderBottom: 0 }} />
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
                                                <TableCell />
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
                                                        <Button disableElevation color='primary' startIcon={<ManageAccounts />} onClick={() => navigate('/personas/detalle', { state: { people: value } })}>
                                                            <Typography variant='button'>Administrar</Typography>
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell align='center'>
                                                        {String(decryptMessage(jwtDecode(decryptMessage(token)).role)) === '5' && (
                                                            <Button disableElevation color='warning' startIcon={<Edit />} onClick={() => handleOpenDialogUpdate(value)}>
                                                                <Typography variant='button'>Editar</Typography>
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align='center'>
                                                        {String(decryptMessage(jwtDecode(decryptMessage(token)).role)) === '5' && (
                                                            <Button disableElevation color='error' startIcon={<Close />} onClick={() => handleOpenDialogDelete(value)}>
                                                                <Typography variant='button'>Eliminar</Typography>
                                                            </Button>
                                                        )}
                                                    </TableCell>
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
                <DialogTitle>Nueva Persona</DialogTitle>
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

                    <Box component={Paper} elevation={0} variant='outlined'>
                        <Accordion elevation={0}>
                            <AccordionSummary expandIcon={<ExpandMore />} id='panel1-header'>
                                <Box display={'flex'} alignItems={'center'} mr={1}>
                                    {(spanishFullname !== '' && hebrewFullname !== '' && yiddishFullname !== '') ? (
                                        <Tooltip title='Completado'>
                                            <CheckCircle color='success' />
                                        </Tooltip>
                                    ) : (
                                        <Tooltip title='Pendiente'>
                                            <ErrorIcon color='error' />
                                        </Tooltip>
                                    )}
                                </Box>

                                <Typography component='span' mr={1}>Nombre Completo</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <TextField fullWidth label='Nombre completo en español' variant='outlined' type='text' value={spanishFullname} onChange={(e) => setSpanishFullname(e.target.value)} slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position='start'>
                                                <Tooltip title={'Obligatorio'}>
                                                    <Emergency color='error' fontSize='small' />
                                                </Tooltip>
                                            </InputAdornment>
                                        ),
                                    }
                                }} sx={{ mb: 2 }} />

                                <TextField fullWidth disabled label='Nombre completo en hebreo' variant='outlined' type='text' value={hebrewFullname} onChange={(e) => setHebrewFullname(e.target.value)} sx={{ mb: 2 }} />

                                <TextField fullWidth disabled label='Nombre completo en yiddish' variant='outlined' type='text' value={yiddishFullname} onChange={(e) => setYiddishFullname(e.target.value)} />
                            </AccordionDetails>
                        </Accordion>
                    </Box>

                    <Box component={Paper} elevation={0} variant='outlined' mt={2}>
                        <Accordion elevation={0}>
                            <AccordionSummary expandIcon={<ExpandMore />} id='panel1-header'>
                                <Box display={'flex'} alignItems={'center'} mr={1}>
                                    {(gregorianBirthDate !== '' && hebrewBirthDate !== '') ? (
                                        <Tooltip title='Completado'>
                                            <CheckCircle color='success' />
                                        </Tooltip>
                                    ) : (
                                        <Tooltip title='Pendiente'>
                                            <ErrorIcon color='error' />
                                        </Tooltip>
                                    )}
                                </Box>

                                <Typography component='span'>Fechas de Nacimiento</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <TextField fullWidth label='Fecha en calendario gregoriano' variant='outlined' type='date' value={gregorianBirthDate} onChange={(e) => setGregorianBirthDate(e.target.value)} slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position='start'>
                                                <Tooltip title={'Obligatorio'}>
                                                    <Emergency color='error' fontSize='small' />
                                                </Tooltip>
                                            </InputAdornment>
                                        ),
                                    }
                                }} sx={{ mb: 2 }} />

                                <TextField fullWidth disabled label='Fecha en calendario hebreo' variant='outlined' type='text' value={hebrewBirthDate} onChange={(e) => setHebrewBirthDate(e.target.value)} />
                            </AccordionDetails>
                        </Accordion>
                    </Box>

                    <Box component={Paper} elevation={0} variant='outlined' mt={2}>
                        <Accordion elevation={0}>
                            <AccordionSummary expandIcon={<ExpandMore />} id='panel1-header'>
                                <Box display={'flex'} alignItems={'center'} mr={1}>
                                    {(countryBirth !== '' && cityBirth !== '') ? (
                                        <Tooltip title='Completado'>
                                            <CheckCircle color='success' />
                                        </Tooltip>
                                    ) : (
                                        <Tooltip title='Pendiente'>
                                            <ErrorIcon color='error' />
                                        </Tooltip>
                                    )}
                                </Box>

                                <Typography component='span'>Lugares de Nacimiento</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <TextField fullWidth label='País' variant='outlined' type='text' value={countryBirth} onChange={(e) => setCountryBirth(e.target.value)} slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position='start'>
                                                <Tooltip title={'Obligatorio'}>
                                                    <Emergency color='error' fontSize='small' />
                                                </Tooltip>
                                            </InputAdornment>
                                        ),
                                    }
                                }} sx={{ mb: 2 }} />

                                <TextField fullWidth label='Ciudad' variant='outlined' type='text' value={cityBirth} onChange={(e) => setCityBirth(e.target.value)} slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position='start'>
                                                <Tooltip title={'Obligatorio'}>
                                                    <Emergency color='error' fontSize='small' />
                                                </Tooltip>
                                            </InputAdornment>
                                        ),
                                    }
                                }} sx={{ mb: 2 }} />

                                <TextField fullWidth label='Región' variant='outlined' type='text' value={regionBirth} onChange={(e) => setRegionBirth(e.target.value)} sx={{ mb: 2 }} />
                            </AccordionDetails>
                        </Accordion>
                    </Box>

                    <Box component={Paper} elevation={0} variant='outlined' mt={2}>
                        <Accordion elevation={0}>
                            <AccordionSummary expandIcon={<ExpandMore />} id='panel1-header'>
                                <Box display={'flex'} alignItems={'center'} mr={1}>
                                    {(gregorianDeathDate !== '' && hebrewDeathDate !== '') ? (
                                        <Tooltip title='Completado'>
                                            <CheckCircle color='success' />
                                        </Tooltip>
                                    ) : (
                                        <Tooltip title='Pendiente'>
                                            <ErrorIcon color='error' />
                                        </Tooltip>
                                    )}
                                </Box>

                                <Typography component='span'>Fechas de Fallecimiento</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <TextField fullWidth label='Fecha en calendario gregoriano' variant='outlined' type='date' value={gregorianDeathDate} onChange={(e) => setGregorianDeathDate(e.target.value)} slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position='start'>
                                                <Tooltip title={'Obligatorio'}>
                                                    <Emergency color='error' fontSize='small' />
                                                </Tooltip>
                                            </InputAdornment>
                                        ),
                                    }
                                }} sx={{ mb: 2 }} />

                                <TextField disabled fullWidth label='Fecha en calendario hebreo' variant='outlined' type='text' value={hebrewDeathDate} onChange={(e) => setHebrewDeathDate(e.target.value)} />
                            </AccordionDetails>
                        </Accordion>
                    </Box>

                    <Box component={Paper} elevation={0} variant='outlined' mt={2}>
                        <Accordion elevation={0}>
                            <AccordionSummary expandIcon={<ExpandMore />} id='panel1-header'>
                                <Box display={'flex'} alignItems={'center'} mr={1}>
                                    {(files.length > 0) ? (
                                        <Tooltip title='Completado'>
                                            <CheckCircle color='success' />
                                        </Tooltip>
                                    ) : (
                                        <Tooltip title='Pendiente'>
                                            <ErrorIcon color='error' />
                                        </Tooltip>
                                    )}
                                </Box>

                                <Typography component='span'>Fotografías personales y familiares {files.length > 0 && (
                                    `(${files.length} ${files.length > 1 ? 'imagenes' : 'imagen'})`
                                )}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                {files.length <= 0 ? (
                                    <Button disableElevation variant='contained' component='label' startIcon={<InsertDriveFile />}>
                                        <Typography variant='button'>Cargar imagenes</Typography>

                                        <input type='file' accept='.jpg, .jpeg, .png, .webp, .tiff, .bmp, .heif' hidden multiple onChange={(e) => {
                                            const myFiles = Array.from(e.target.files);
                                            const newFiles = myFiles.map(file => ({
                                                name: file.name,
                                                url: URL.createObjectURL(file),
                                                base64: null
                                            }));

                                            newFiles.forEach((file, index) => {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    file.base64 = reader.result.split(',')[1];
                                                    setFiles(prev => [...prev, file]);
                                                };
                                                reader.readAsDataURL(myFiles[index]);
                                            });
                                        }} />
                                    </Button>
                                ) : (
                                    <Fragment>
                                        <Button disableElevation variant='contained' component='label' startIcon={<InsertDriveFile />}>
                                            <Typography variant='button'>Cargar imagenes</Typography>

                                            <input type='file' accept='.jpg, .jpeg, .png, .webp, .tiff, .bmp, .heif' hidden multiple onChange={(e) => {
                                                const myFiles = Array.from(e.target.files);
                                                const newFiles = myFiles.map(file => ({
                                                    name: file.name,
                                                    url: URL.createObjectURL(file),
                                                    base64: null
                                                }));

                                                newFiles.forEach((file, index) => {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        file.base64 = reader.result.split(',')[1];
                                                        setFiles(prev => [...prev, file]);
                                                    };
                                                    reader.readAsDataURL(myFiles[index]);
                                                });
                                            }} />
                                        </Button>

                                        <Box display={'flex'} flexDirection={'column'} mt={2}>
                                            {files.length <= 0 ? (
                                                <Typography>No hay archivos cargados</Typography>
                                            ) : (
                                                <List component={Paper} elevation={0} variant='outlined' sx={{ textOverflow: 'ellipsis' }}>
                                                    {files.map((file, index) => (
                                                        <ListItem key={index} secondaryAction={
                                                            <Fragment>
                                                                <Tooltip title='Ver imagen'>
                                                                    <IconButton edge='end' onClick={() => window.open(file.url, '_blank')}>
                                                                        <Visibility />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title='Eliminar imagen' onClick={() => {
                                                                    setFiles(prev => prev.filter((_, i) => i !== index));
                                                                    URL.revokeObjectURL(file.url);
                                                                }}>
                                                                    <IconButton edge='end' sx={{ ml: 2 }}>
                                                                        <Delete />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Fragment>
                                                        }>
                                                            <ListItemIcon>
                                                                <Avatar sx={{ bgcolor: blue['100'], color: blue['600'] }}>
                                                                    <Image />
                                                                </Avatar>
                                                            </ListItemIcon>
                                                            <ListItemText primary={file.name} sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            )}
                                        </Box>
                                    </Fragment>
                                )}
                            </AccordionDetails>
                        </Accordion>
                    </Box>

                    <Box component={Paper} elevation={0} variant='outlined' mt={2}>
                        <Accordion elevation={0}>
                            <AccordionSummary expandIcon={<ExpandMore />} id='panel1-header'>
                                <Box display={'flex'} alignItems={'center'} mr={1}>
                                    {deltaContent.ops !== undefined && (
                                        String(deltaContent?.ops[0].insert).trim() !== '' ? (
                                            <Tooltip title='Completado'>
                                                <CheckCircle color='success' />
                                            </Tooltip>
                                        ) : (
                                            <Tooltip title='Pendiente'>
                                                <ErrorIcon color='error' />
                                            </Tooltip>
                                        )
                                    )}
                                </Box>

                                <Typography component='span'>Biografías</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box component={Paper} elevation={0}>
                                    <ReactQuill
                                        value={deltaContent}
                                        onChange={(content, delta, source, editor) => setDeltaContent(editor.getContents())}
                                        modules={modules}
                                        theme='snow'
                                        placeholder='Escribe una biografía...'
                                        style={{ width: '100%' }}
                                        className='rounded'
                                    />
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button variant='text' color='primary' onClick={handlePostPeople}>
                        <Typography variant='button'>Confirmar</Typography>
                    </Button>
                    <Button variant='text' color='inherit' onClick={() => setDialogCreate(false)}>
                        <Typography variant='button'>Cerrar</Typography>
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog onClose={() => setDialogUpdate(false)} open={dialogUpdate} maxWidth='md' fullScreen={fullScreen}>
                <DialogTitle>Actualizar Persona</DialogTitle>
                <DialogContent>
                    {selectedData === null ? (
                        <Box component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                            <Warning fontSize='large' color='warning' />
                            <Typography ml={2}>Seleccione a una persona para continuar</Typography>
                        </Box>
                    ) : (
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

                            <Box component={Paper} elevation={0} variant='outlined'>
                                <Accordion elevation={0}>
                                    <AccordionSummary expandIcon={<ExpandMore />} id='panel1-header'>
                                        <Box display={'flex'} alignItems={'center'} mr={1}>
                                            {(spanishFullname !== '' && hebrewFullname !== '' && yiddishFullname !== '') ? (
                                                <Tooltip title='Completado'>
                                                    <CheckCircle color='success' />
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title='Pendiente'>
                                                    <ErrorIcon color='error' />
                                                </Tooltip>
                                            )}
                                        </Box>

                                        <Typography component='span' mr={1}>Nombre Completo</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <TextField fullWidth label='Nombre completo en español' variant='outlined' type='text' value={spanishFullname} onChange={(e) => setSpanishFullname(e.target.value)} slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position='start'>
                                                        <Tooltip title={'Obligatorio'}>
                                                            <Emergency color='error' fontSize='small' />
                                                        </Tooltip>
                                                    </InputAdornment>
                                                ),
                                            }
                                        }} sx={{ mb: 2 }} />

                                        <TextField fullWidth disabled label='Nombre completo en hebreo' variant='outlined' type='text' value={hebrewFullname} onChange={(e) => setHebrewFullname(e.target.value)} sx={{ mb: 2 }} />

                                        <TextField fullWidth disabled label='Nombre completo en yiddish' variant='outlined' type='text' value={yiddishFullname} onChange={(e) => setYiddishFullname(e.target.value)} />
                                    </AccordionDetails>
                                </Accordion>
                            </Box>

                            <Box component={Paper} elevation={0} variant='outlined' mt={2}>
                                <Accordion elevation={0}>
                                    <AccordionSummary expandIcon={<ExpandMore />} id='panel1-header'>
                                        <Box display={'flex'} alignItems={'center'} mr={1}>
                                            {(gregorianBirthDate !== '' && hebrewBirthDate !== '') ? (
                                                <Tooltip title='Completado'>
                                                    <CheckCircle color='success' />
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title='Pendiente'>
                                                    <ErrorIcon color='error' />
                                                </Tooltip>
                                            )}
                                        </Box>

                                        <Typography component='span'>Fechas de Nacimiento</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <TextField fullWidth label='Fecha en calendario gregoriano' variant='outlined' type='date' value={gregorianBirthDate} onChange={(e) => setGregorianBirthDate(e.target.value)} slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position='start'>
                                                        <Tooltip title={'Obligatorio'}>
                                                            <Emergency color='error' fontSize='small' />
                                                        </Tooltip>
                                                    </InputAdornment>
                                                ),
                                            }
                                        }} sx={{ mb: 2 }} />

                                        <TextField fullWidth disabled label='Fecha en calendario hebreo' variant='outlined' type='text' value={hebrewBirthDate} onChange={(e) => setHebrewBirthDate(e.target.value)} />
                                    </AccordionDetails>
                                </Accordion>
                            </Box>

                            <Box component={Paper} elevation={0} variant='outlined' mt={2}>
                                <Accordion elevation={0}>
                                    <AccordionSummary expandIcon={<ExpandMore />} id='panel1-header'>
                                        <Box display={'flex'} alignItems={'center'} mr={1}>
                                            {(countryBirth !== '' && cityBirth !== '') ? (
                                                <Tooltip title='Completado'>
                                                    <CheckCircle color='success' />
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title='Pendiente'>
                                                    <ErrorIcon color='error' />
                                                </Tooltip>
                                            )}
                                        </Box>

                                        <Typography component='span'>Lugares de Nacimiento</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <TextField fullWidth label='País' variant='outlined' type='text' value={countryBirth} onChange={(e) => setCountryBirth(e.target.value)} slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position='start'>
                                                        <Tooltip title={'Obligatorio'}>
                                                            <Emergency color='error' fontSize='small' />
                                                        </Tooltip>
                                                    </InputAdornment>
                                                ),
                                            }
                                        }} sx={{ mb: 2 }} />

                                        <TextField fullWidth label='Ciudad' variant='outlined' type='text' value={cityBirth} onChange={(e) => setCityBirth(e.target.value)} slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position='start'>
                                                        <Tooltip title={'Obligatorio'}>
                                                            <Emergency color='error' fontSize='small' />
                                                        </Tooltip>
                                                    </InputAdornment>
                                                ),
                                            }
                                        }} sx={{ mb: 2 }} />

                                        <TextField fullWidth label='Región' variant='outlined' type='text' value={regionBirth} onChange={(e) => setRegionBirth(e.target.value)} sx={{ mb: 2 }} />
                                    </AccordionDetails>
                                </Accordion>
                            </Box>

                            <Box component={Paper} elevation={0} variant='outlined' mt={2}>
                                <Accordion elevation={0}>
                                    <AccordionSummary expandIcon={<ExpandMore />} id='panel1-header'>
                                        <Box display={'flex'} alignItems={'center'} mr={1}>
                                            {(gregorianDeathDate !== '' && hebrewDeathDate !== '') ? (
                                                <Tooltip title='Completado'>
                                                    <CheckCircle color='success' />
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title='Pendiente'>
                                                    <ErrorIcon color='error' />
                                                </Tooltip>
                                            )}
                                        </Box>

                                        <Typography component='span'>Fechas de Fallecimiento</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <TextField fullWidth label='Fecha en calendario gregoriano' variant='outlined' type='date' value={gregorianDeathDate} onChange={(e) => setGregorianDeathDate(e.target.value)} slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <InputAdornment position='start'>
                                                        <Tooltip title={'Obligatorio'}>
                                                            <Emergency color='error' fontSize='small' />
                                                        </Tooltip>
                                                    </InputAdornment>
                                                ),
                                            }
                                        }} sx={{ mb: 2 }} />

                                        <TextField disabled fullWidth label='Fecha en calendario hebreo' variant='outlined' type='text' value={hebrewDeathDate} onChange={(e) => setHebrewDeathDate(e.target.value)} />
                                    </AccordionDetails>
                                </Accordion>
                            </Box>

                            <Box component={Paper} elevation={0} variant='outlined' mt={2}>
                                <Accordion elevation={0}>
                                    <AccordionSummary expandIcon={<ExpandMore />} id='panel1-header'>
                                        <Box display={'flex'} alignItems={'center'} mr={1}>
                                            {(files.length > 0) ? (
                                                <Tooltip title='Completado'>
                                                    <CheckCircle color='success' />
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title='Pendiente'>
                                                    <ErrorIcon color='error' />
                                                </Tooltip>
                                            )}
                                        </Box>

                                        <Typography component='span'>Fotografías personales y familiares {files.length > 0 && (
                                            `(${files.length} ${files.length > 1 ? 'imagenes' : 'imagen'})`
                                        )}</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        {files.length <= 0 ? (
                                            <Button disableElevation variant='contained' component='label' startIcon={<InsertDriveFile />}>
                                                <Typography variant='button'>Cargar imagenes</Typography>

                                                <input type='file' accept='.jpg, .jpeg, .png, .webp, .tiff, .bmp, .heif' hidden multiple onChange={(e) => {
                                                    const myFiles = Array.from(e.target.files);
                                                    const newFiles = myFiles.map(file => ({
                                                        id: null,
                                                        name: file.name,
                                                        url: URL.createObjectURL(file),
                                                        base64: null
                                                    }));

                                                    newFiles.forEach((file, index) => {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            file.base64 = reader.result.split(',')[1];
                                                            setFiles(prev => [...prev, file]);
                                                        };
                                                        reader.readAsDataURL(myFiles[index]);
                                                    });
                                                }} />
                                            </Button>
                                        ) : (
                                            <Fragment>
                                                <Button disableElevation variant='contained' component='label' startIcon={<InsertDriveFile />}>
                                                    <Typography variant='button'>Cargar imagenes</Typography>

                                                    <input type='file' accept='.jpg, .jpeg, .png, .webp, .tiff, .bmp, .heif' hidden multiple onChange={(e) => {
                                                        const myFiles = Array.from(e.target.files);
                                                        const newFiles = myFiles.map(file => ({
                                                            id: null,
                                                            name: file.name,
                                                            url: URL.createObjectURL(file),
                                                            base64: null
                                                        }));

                                                        newFiles.forEach((file, index) => {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                file.base64 = reader.result.split(',')[1];
                                                                setFiles(prev => [...prev, file]);
                                                            };
                                                            reader.readAsDataURL(myFiles[index]);
                                                        });
                                                    }} />
                                                </Button>

                                                <Box display={'flex'} flexDirection={'column'} mt={2}>
                                                    {files.length <= 0 ? (
                                                        <Typography>No hay archivos cargados</Typography>
                                                    ) : (
                                                        <List component={Paper} elevation={0} variant='outlined' sx={{ textOverflow: 'ellipsis' }}>
                                                            {files.map((file, index) => (
                                                                <ListItem key={index} secondaryAction={
                                                                    <Fragment>
                                                                        <Tooltip title='Ver imagen'>
                                                                            <IconButton edge='end' onClick={() => window.open(file.url, '_blank')}>
                                                                                <Visibility />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                        <Tooltip title='Eliminar imagen' onClick={() => {
                                                                            setFiles(prev => prev.filter((_, i) => i !== index));
                                                                            URL.revokeObjectURL(file.url);
                                                                        }}>
                                                                            <IconButton edge='end' sx={{ ml: 2 }}>
                                                                                <Delete />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </Fragment>
                                                                }>
                                                                    <ListItemIcon>
                                                                        <Avatar sx={{ bgcolor: blue['100'], color: blue['600'] }}>
                                                                            <Image />
                                                                        </Avatar>
                                                                    </ListItemIcon>
                                                                    <ListItemText primary={file.name} sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} />
                                                                </ListItem>
                                                            ))}
                                                        </List>
                                                    )}
                                                </Box>
                                            </Fragment>
                                        )}
                                    </AccordionDetails>
                                </Accordion>
                            </Box>

                            <Box component={Paper} elevation={0} variant='outlined' mt={2}>
                                <Accordion elevation={0}>
                                    <AccordionSummary expandIcon={<ExpandMore />} id='panel1-header'>
                                        <Box display={'flex'} alignItems={'center'} mr={1}>
                                            {deltaContent.ops !== undefined && (
                                                String(deltaContent?.ops[0].insert).trim() !== '' ? (
                                                    <Tooltip title='Completado'>
                                                        <CheckCircle color='success' />
                                                    </Tooltip>
                                                ) : (
                                                    <Tooltip title='Pendiente'>
                                                        <ErrorIcon color='error' />
                                                    </Tooltip>
                                                )
                                            )}
                                        </Box>

                                        <Typography component='span'>Biografías</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Box component={Paper} elevation={0}>
                                            <ReactQuill
                                                value={deltaContent}
                                                onChange={(content, delta, source, editor) => setDeltaContent(editor.getContents())}
                                                modules={modules}
                                                theme='snow'
                                                placeholder='Escribe una biografía...'
                                                style={{ width: '100%' }}
                                                className='rounded'
                                            />
                                        </Box>
                                    </AccordionDetails>
                                </Accordion>
                            </Box>
                        </Fragment>
                    )}
                </DialogContent>
                <DialogActions>
                    {selectedData !== null && (
                        <Button variant='text' color='primary' onClick={handlePutPeople}>
                            <Typography variant='button'>Confirmar</Typography>
                        </Button>
                    )}

                    <Button variant='text' color='inherit' onClick={() => setDialogUpdate(false)}>
                        <Typography variant='button'>Cerrar</Typography>
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog onClose={() => setDialogDelete(false)} open={dialogDelete} maxWidth='md' fullScreen={fullScreen}>
                <DialogTitle>Eliminar Persona</DialogTitle>
                <DialogContent>
                    {selectedData === null ? (
                        <Box component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                            <Warning fontSize='large' color='warning' />
                            <Typography ml={2}>Seleccione a una persona para continuar</Typography>
                        </Box>
                    ) : (
                        <Fragment>
                            <Typography textAlign={'justify'}>¿Esta seguro de eliminar a la persona <b>{decryptMessage(selectedData.nombre_espanol)}</b> del sistema?, una vez eliminada deberá crearla nuevamente si desea restablecerla.</Typography>
                            <Typography textAlign={'justify'} mt={2}>Si está de acuerdo, pulse <Typography variant='button' color='primary'>CONFIRMAR</Typography>. Si no es así, pulse <Typography variant='button' color='textPrimary'>CERRAR</Typography>.</Typography>
                        </Fragment>
                    )}
                </DialogContent>
                <DialogActions>
                    {selectedData !== null && (
                        <Button variant='text' color='primary' onClick={handleDeletePeople}>
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
}

export default Index