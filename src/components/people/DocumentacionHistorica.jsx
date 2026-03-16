import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SHOW_ERROR_MESSAGE, SHOW_SUCCESS_MESSAGE } from '../../slices/notificationSlice';
import { decryptMessage, encryptMessage } from '../../helpers/helpers';

import { blue, grey } from '@mui/material/colors';
import { Attachment, Close, Delete, Edit, Emergency, ExitToApp, Filter1, Filter2, Filter3, Filter4, Filter5, Filter6, Filter7, Filter8, Filter9, FilterList, FilterListOff, InsertDriveFile, LibraryBooks, NoteAdd, Refresh, Visibility, Warning } from '@mui/icons-material';
import { Alert, Avatar, Box, Button, CircularProgress, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputAdornment, InputLabel, List, ListItem, ListItemIcon, ListItemText, Menu, MenuItem, MenuList, Pagination, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';

import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';
import { debounce } from 'lodash';
import { jwtDecode } from 'jwt-decode';

const items = [{
    value: 'acta_nacimiento',
    item: 'Acta de Nacimiento'
}, {
    value: 'acta_matrimonio',
    item: 'Acta de Matrimonio'
}, {
    value: 'acta_defuncion',
    item: 'Acta de Defunción'
}, {
    value: 'ketubot',
    item: 'Ketubot (Contrato Matrimonial)'
}, {
    value: 'documento_migracion',
    item: 'Documentos de Migración'
}, {
    value: 'documento_pasaportes',
    item: 'Documentos de Pasaportes'
}, {
    value: 'fotografias_historicas',
    item: 'Fotografías históricas familiares'
}, {
    value: 'cartas_correspondencias',
    item: 'Cartas y correspondencia familiar'
}, {
    value: 'certificados_estudios_profesionales',
    item: 'Certificados de estudios y profesiones'
}];

const digitalizacion = [{
    value: 'baja',
    item: 'Calidad Baja'
}, {
    value: 'media',
    item: 'Calidad Media'
}, {
    value: 'alta',
    item: 'Calidad Alta'
}];

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

const DocumentacionHistorica = ({ people, viewOnly }) => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const containerRef = useRef(null);
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const token = useSelector((state) => state.user_cementerio_qr.data);

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const [width, setWidth] = useState(0);
    const [loading, setLoading] = useState(false);
    const [openDanger, setOpenDanger] = useState(true);

    const [documentos, setDocumentos] = useState([]);
    const [tipoDocumento, setTipoDocumento] = useState('');
    const [idiomaOriginal, setIdiomaOriginal] = useState('');
    const [familiaRelacionada, setFamiliaRelacionada] = useState('');
    const [estadoConservacion, setEstadoConservacion] = useState('');
    const [descripcionContenido, setDescripcionContenido] = useState({});
    const [calidadDigitalizacion, setCalidadDigitalizacion] = useState('');
    const [fechaAproximadaDocumento, setFechaAproximadaDocumento] = useState('');

    const [dialogCreate, setDialogCreate] = useState(false);
    const [dialogUpdate, setDialogUpdate] = useState(false);
    const [dialogDelete, setDialogDelete] = useState(false);
    const [dialogDetail, setDialogDetail] = useState(false);

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

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/people/document/${page}/${rows}/${people.id}`, requestOptions);
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
    }, [token, people, dispatch, setData, setDataError, setDataErrorMessage]);

    const handleGetDataCount = useCallback(async () => {
        try {
            setLoading(true);

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestOptions = {
                method: 'GET',
                headers: requestHeader,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/people/document/count/${people.id}`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setLoading(false);
            setCount(responseJson.message);
        }
        catch (error) {
            setLoading(false);
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [token, people, dispatch, setCount, setLoading]);

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

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/people/document/param/${value}/${people.id}`, requestOptions);
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
    }, [token, people, dispatch, setDataSearch, setDataSearchError, setDataSearchErrorMessage]);

    const handlePostDocument = useCallback(async () => {
        try {
            setLoading(true);

            if (tipoDocumento === '') {
                throw new Error('Complete el Tipo de Documento');
            }

            if (documentos.length <= 0) {
                throw new Error('Complete los Documentos');
            }

            if (idiomaOriginal === '') {
                throw new Error('Complete el Idioma Original del Documento');
            }

            if (familiaRelacionada === '') {
                throw new Error('Complete la Familia Relacionada del Documento');
            }

            if (estadoConservacion === '') {
                throw new Error('Complete el Estado de Conservación del Documento');
            }

            if (descripcionContenido !== undefined) {
                if (String(descripcionContenido.ops[0].insert).trim() === '') {
                    throw new Error('Complete la Descripción del Contenido');
                }
            }

            if (calidadDigitalizacion === '') {
                throw new Error('Complete la Calidad de Digitalización');
            }

            if (fechaAproximadaDocumento === '') {
                throw new Error('Complete la Fecha Aproximada del Documento');
            }

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'people_id': encryptMessage(String(people.id)),
                'type_document': encryptMessage(tipoDocumento),
                'file_name': encryptMessage(documentos[0].name),
                'original_language': encryptMessage(idiomaOriginal),
                'file_base_64': encryptMessage(documentos[0].base64),
                'preserve_state': encryptMessage(estadoConservacion),
                'family_relationated': encryptMessage(familiaRelacionada),
                'aproximated_date': encryptMessage(fechaAproximadaDocumento),
                'digitalization_quality': encryptMessage(calidadDigitalizacion),
                'content_description': encryptMessage(JSON.stringify(descripcionContenido))
            });

            const requestOptions = {
                method: 'POST',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/people/document`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setDocumentos([]);
            setTipoDocumento('');
            setIdiomaOriginal('');
            setFamiliaRelacionada('');
            setEstadoConservacion('');
            setDescripcionContenido({});
            setCalidadDigitalizacion('');
            setFechaAproximadaDocumento('');

            if (filterValue === '') {
                await handleGetDataCount();
                await handleGetData(page, rowsPerPage);
            } else {
                await handleGetDataSearch(filterValue);
            }

            setLoading(false);
            setDialogCreate(false);
            dispatch(SHOW_SUCCESS_MESSAGE(responseJson.message));
        }
        catch (error) {
            setLoading(false);
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [token, page, rowsPerPage, filterValue, documentos, people, tipoDocumento, idiomaOriginal, familiaRelacionada, estadoConservacion, descripcionContenido, calidadDigitalizacion, fechaAproximadaDocumento, dispatch, handleGetData, handleGetDataCount, handleGetDataSearch, setLoading, encryptMessage, decryptMessage, setDialogCreate, setDocumentos, setTipoDocumento, setIdiomaOriginal, setFamiliaRelacionada, setEstadoConservacion, setDescripcionContenido, setCalidadDigitalizacion, setFechaAproximadaDocumento]);

    const handlePutDocument = useCallback(async () => {
        try {
            setLoading(true);

            if (tipoDocumento === '') {
                throw new Error('Complete el Tipo de Documento');
            }

            if (documentos.length <= 0) {
                throw new Error('Complete los Documentos');
            }

            if (idiomaOriginal === '') {
                throw new Error('Complete el Idioma Original del Documento');
            }

            if (familiaRelacionada === '') {
                throw new Error('Complete la Familia Relacionada del Documento');
            }

            if (estadoConservacion === '') {
                throw new Error('Complete el Estado de Conservación del Documento');
            }

            if (descripcionContenido !== undefined) {
                if (String(descripcionContenido.ops[0].insert).trim() === '') {
                    throw new Error('Complete la Descripción del Contenido');
                }
            }

            if (calidadDigitalizacion === '') {
                throw new Error('Complete la Calidad de Digitalización');
            }

            if (fechaAproximadaDocumento === '') {
                throw new Error('Complete la Fecha Aproximada del Documento');
            }

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'id': encryptMessage(String(selectedData.id)),
                'people_id': encryptMessage(String(people.id)),
                'type_document': encryptMessage(tipoDocumento),
                'file_name': encryptMessage(documentos[0].name),
                'original_language': encryptMessage(idiomaOriginal),
                'file_base_64': encryptMessage(documentos[0].base64),
                'preserve_state': encryptMessage(estadoConservacion),
                'family_relationated': encryptMessage(familiaRelacionada),
                'aproximated_date': encryptMessage(fechaAproximadaDocumento),
                'digitalization_quality': encryptMessage(calidadDigitalizacion),
                'content_description': encryptMessage(JSON.stringify(descripcionContenido))
            });

            const requestOptions = {
                method: 'PUT',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/people/document`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setDocumentos([]);
            setTipoDocumento('');
            setIdiomaOriginal('');
            setFamiliaRelacionada('');
            setEstadoConservacion('');
            setDescripcionContenido({});
            setCalidadDigitalizacion('');
            setFechaAproximadaDocumento('');

            if (filterValue === '') {
                await handleGetDataCount();
                await handleGetData(page, rowsPerPage);
            } else {
                await handleGetDataSearch(filterValue);
            }

            setLoading(false);
            setDialogUpdate(false);
            dispatch(SHOW_SUCCESS_MESSAGE(responseJson.message));
        }
        catch (error) {
            setLoading(false);
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [token, page, rowsPerPage, filterValue, selectedData, documentos, people, tipoDocumento, idiomaOriginal, familiaRelacionada, estadoConservacion, descripcionContenido, calidadDigitalizacion, fechaAproximadaDocumento, dispatch, handleGetData, handleGetDataCount, handleGetDataSearch, setLoading, encryptMessage, decryptMessage, setDialogUpdate, setDocumentos, setTipoDocumento, setIdiomaOriginal, setFamiliaRelacionada, setEstadoConservacion, setDescripcionContenido, setCalidadDigitalizacion, setFechaAproximadaDocumento]);

    const handleDeleteDocument = useCallback(async () => {
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

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/people/document`, requestOptions);
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

    const handleViewDocument = useCallback((base64, fileName) => {
        try {
            dispatch(SHOW_SUCCESS_MESSAGE('Mostrando documento, en unos segundos más debe abrirse'));

            const extension = fileName.split('.').pop().toLowerCase();

            const mimeTypes = {
                pdf: 'application/pdf',
                jpg: 'image/jpeg',
                jpeg: 'image/jpeg',
                png: 'image/png',
                gif: 'image/gif',
                docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                txt: 'text/plain'
            };

            const mimeType = mimeTypes[extension] || 'application/octet-stream';

            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);

            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });
            const blobUrl = URL.createObjectURL(blob);

            dispatch(SHOW_SUCCESS_MESSAGE('Documento abierto'));
            window.open(blobUrl, '_blank');
        } catch (e) {
            dispatch(SHOW_ERROR_MESSAGE(`Error al abrir el documento: ${e.message}`));
        }
    }, [dispatch]);

    const handleGetDocument = useCallback(async (id, nombre = '', soloBase64 = false) => {
        try {
            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestOptions = {
                method: 'GET',
                headers: requestHeader,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/people/document/${id}`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            if (soloBase64) {
                return decryptMessage(responseJson.message.base64)
            } else {
                handleViewDocument(decryptMessage(responseJson.message.base64), nombre);
            }
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [token, dispatch, handleViewDocument]);


    const handleOpenDialogDelete = useCallback((payload) => {
        setSelectedData(payload);
        setDialogDelete(true);
    }, [setSelectedData, setDialogDelete]);

    const handleOpenDialogDetail = useCallback((payload) => {
        setSelectedData(payload);
        console.log(payload);

        setDialogDetail(true);
    }, [setSelectedData, setDialogDetail]);

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

    const handleOpenDialogUpdate = useCallback(async (payload) => {
        setDialogUpdate(true);
        setSelectedData(payload);

        setTipoDocumento(decryptMessage(payload.tipo_documento));
        setIdiomaOriginal(decryptMessage(payload.idioma_original));
        setFamiliaRelacionada(decryptMessage(payload.familia_relacionada));
        setEstadoConservacion(decryptMessage(payload.estado_conservacion));
        setDescripcionContenido(JSON.parse(decryptMessage(payload.descripcion_contenido)));
        setCalidadDigitalizacion(decryptMessage(payload.calidad_digitalizacion));
        setFechaAproximadaDocumento(decryptMessage(payload.fecha_aproximada));

        const newFiles = [];
        const fileName = decryptMessage(payload.nombre);
        const extension = fileName.split('.').pop().toLowerCase();
        const fileBase64 = await handleGetDocument(payload.id, '', true);

        const mimeTypes = {
            pdf: 'application/pdf',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            txt: 'text/plain'
        };

        const mimeType = mimeTypes[extension] || 'application/octet-stream';

        const blob = base64ToBlob(`data:${mimeType};base64,${fileBase64}`);
        const url = URL.createObjectURL(blob);

        newFiles.push({
            name: fileName,
            url: url,
            base64: `data:${mimeType};base64,${fileBase64}`
        });

        setDocumentos(newFiles);
    }, [decryptMessage, handleGetDocument, setDocumentos, setDialogUpdate, setSelectedData, setTipoDocumento, setIdiomaOriginal, setFamiliaRelacionada, setEstadoConservacion, setDescripcionContenido, setCalidadDigitalizacion, setFechaAproximadaDocumento]);

    const handleChangeRowsPerPage = useCallback((payload) => {
        setRowsPerPage(payload);
        setAnchorEl(null);
    }, [setRowsPerPage, setAnchorEl]);


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
        <Fragment>
            {loading ? (
                <Box component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                    <CircularProgress />
                    <Typography ml={2}>Procesando, espere...</Typography>
                </Box>
            ) : (
                <Fragment>
                    <Box display={'flex'} alignItems={'center'} flexWrap={'wrap'}>
                        {!viewOnly && (
                            String(decryptMessage(jwtDecode(decryptMessage(token)).role)) === '5' && (
                                <Fragment>
                                    <Button disableElevation variant='contained' color='primary' startIcon={<NoteAdd />} onClick={() => setDialogCreate(true)} sx={{ mr: 2, mb: 2 }}>
                                        <Typography variant='button'>Crear documento</Typography>
                                    </Button>

                                    <Button disableElevation variant='contained' color='primary' startIcon={<Refresh />} sx={{ mr: 2, mb: 2 }} onClick={() => { filterValue !== '' ? handleGetDataSearch(filterValue) : handleGetData(page, rowsPerPage) }}>
                                        <Typography variant='button'>Actualizar documentos</Typography>
                                    </Button>
                                </Fragment>
                            )
                        )}

                        <Button disableElevation color='primary' variant='contained' startIcon={filter ? <FilterListOff /> : <FilterList />} sx={{ mr: 2, mb: 2 }} onClick={() => setFilter(!filter)}>
                            <Typography variant='button'>{filter ? 'Ocultar Filtro' : 'Filtrar Documentos'}</Typography>
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
                                        <Typography ml={1}>Error al obtener los documentos: {dataSearchErrorMessage}</Typography>
                                    </Box>
                                    <Button disableElevation variant='contained' color='primary' startIcon={<Refresh />} sx={{ width: 'fit-content' }} onClick={() => handleGetDataSearch(filterValue)}>
                                        <Typography variant='button'>Consultar nuevamente</Typography>
                                    </Button>
                                </Box>
                            ) : dataSearch === null ? (
                                <Box mt={2} component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                                    <CircularProgress />
                                    <Typography ml={2}>Cargando documentos</Typography>
                                </Box>
                            ) : (
                                <Fragment>
                                    <Typography fontWeight={900} mb={2} fontSize={17} sx={{ textDecoration: 'underline' }}>Registros Actuales: {dataSearch.length}</Typography>

                                    <Box component={Paper} elevation={0} variant='outlined' overflow={'auto'} m={'auto'}>
                                        <TableContainer sx={{ maxHeight: '53vh' }}>
                                            <Table size='small' stickyHeader>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell align='center' sx={{ fontSize: 17 }}>Tipo de documento</TableCell>
                                                        <TableCell align='center' sx={{ fontSize: 17 }}>Idioma Original</TableCell>
                                                        <TableCell align='center' sx={{ fontSize: 17 }}>Estado de Conservación</TableCell>
                                                        <TableCell align='center' sx={{ fontSize: 17 }}>Calidad de Digitalización</TableCell>
                                                        <TableCell align='center' sx={{ fontSize: 17 }}>Fecha Aproximada del Documento</TableCell>
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
                                                            <TableCell align='center'>{items.filter(x => String(x.value) === String(decryptMessage(value.tipo_documento)))[0].item}</TableCell>
                                                            <TableCell align='center'>{decryptMessage(value.idioma_original)}</TableCell>
                                                            <TableCell align='center'>{decryptMessage(value.estado_conservacion)}</TableCell>
                                                            <TableCell align='center'>{digitalizacion.filter(x => String(x.value) === String(decryptMessage(value.calidad_digitalizacion)))[0].item}</TableCell>
                                                            <TableCell align='center'>{decryptMessage(value.fecha_aproximada)}</TableCell>
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
                                        <Typography ml={1}>Error al obtener los documentos: {dataErrorMessage}</Typography>
                                    </Box>
                                    <Button disableElevation variant='contained' color='primary' startIcon={<Refresh />} sx={{ width: 'fit-content' }} onClick={() => handleGetData(page, rowsPerPage)}>
                                        <Typography variant='button'>Consultar nuevamente</Typography>
                                    </Button>
                                </Box>
                            ) : data === null ? (
                                <Box component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                                    <CircularProgress />
                                    <Typography ml={2}>Cargando documentos</Typography>
                                </Box>
                            ) : (
                                <Fragment>
                                    <Typography fontWeight={900} mb={2} fontSize={17} sx={{ textDecoration: 'underline' }}>Registros Actuales: {data.length}</Typography>

                                    <Box component={Paper} elevation={0} variant='outlined' overflow={'auto'} m={'auto'}>
                                        <TableContainer sx={{ maxHeight: '53vh' }}>
                                            <Table size='small' stickyHeader>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell align='center' sx={{ fontSize: 17 }}>Tipo de documento</TableCell>
                                                        <TableCell align='center' sx={{ fontSize: 17 }}>Idioma Original</TableCell>
                                                        <TableCell align='center' sx={{ fontSize: 17 }}>Estado de Conservación</TableCell>
                                                        <TableCell align='center' sx={{ fontSize: 17 }}>Calidad de Digitalización</TableCell>
                                                        <TableCell align='center' sx={{ fontSize: 17 }}>Fecha Aproximada del Documento</TableCell>
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
                                                            <TableCell align='center'>{items.filter(x => String(x.value) === String(decryptMessage(value.tipo_documento)))[0].item}</TableCell>
                                                            <TableCell align='center'>{decryptMessage(value.idioma_original)}</TableCell>
                                                            <TableCell align='center'>{decryptMessage(value.estado_conservacion)}</TableCell>
                                                            <TableCell align='center'>{digitalizacion.filter(x => String(x.value) === String(decryptMessage(value.calidad_digitalizacion)))[0].item}</TableCell>
                                                            <TableCell align='center'>{decryptMessage(value.fecha_aproximada)}</TableCell>
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
                </Fragment>
            )}

            <Dialog onClose={() => setDialogCreate(false)} open={dialogCreate} maxWidth='md' fullWidth fullScreen={fullScreen}>
                <DialogTitle>Nuevo Documento</DialogTitle>
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

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel id='select-tipo-label'>Tipo de documento</InputLabel>
                        <Select startAdornment={<InputAdornment position='start'>
                            <Tooltip title={'Obligatorio'}>
                                <Emergency color='error' fontSize='small' />
                            </Tooltip>
                        </InputAdornment>} labelId='select-tipo-label' id='select-tipo' value={tipoDocumento} label='Tipo de documento' onChange={(e) => setTipoDocumento(e.target.value)}>
                            <MenuItem value={''}>Seleccione una opción</MenuItem>

                            {items.map((value, index) => (
                                <MenuItem key={index} value={value.value}>{value.item}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box mb={2}>
                        {documentos.length <= 0 ? (
                            <Button disableElevation variant='contained' component='label' startIcon={<InsertDriveFile />}>
                                <Typography variant='button'>Cargar documento</Typography>

                                <input type='file' accept='*.*' hidden onChange={(e) => {
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
                                            setDocumentos([]);
                                            setDocumentos(prev => [...prev, file]);
                                        };
                                        reader.readAsDataURL(myFiles[index]);
                                    });
                                }} />
                            </Button>
                        ) : (
                            <Fragment>
                                <Button disableElevation variant='contained' component='label' startIcon={<InsertDriveFile />}>
                                    <Typography variant='button'>Reemplazar documento cargado</Typography>

                                    <input type='file' accept='*.*' hidden multiple onChange={(e) => {
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
                                                setDocumentos([]);
                                                setDocumentos(prev => [...prev, file]);
                                            };
                                            reader.readAsDataURL(myFiles[index]);
                                        });
                                    }} />
                                </Button>

                                <Box display={'flex'} flexDirection={'column'} mt={2}>
                                    {documentos.length <= 0 ? (
                                        <Typography>No hay archivos cargados</Typography>
                                    ) : (
                                        <List component={Paper} elevation={0} variant='outlined' sx={{ textOverflow: 'ellipsis' }}>
                                            {documentos.map((file, index) => (
                                                <ListItem key={index} secondaryAction={
                                                    <Fragment>
                                                        <Tooltip title='Ver documento'>
                                                            <IconButton edge='end' onClick={() => window.open(file.url, '_blank')}>
                                                                <Visibility />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title='Eliminar documento' onClick={() => {
                                                            setDocumentos(prev => prev.filter((_, i) => i !== index));
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
                                                            <Attachment />
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
                    </Box>

                    <TextField fullWidth variant='outlined' label='Idioma Original de Documento' value={idiomaOriginal} onChange={(e) => setIdiomaOriginal(e.target.value)} slotProps={{
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

                    <TextField fullWidth variant='outlined' label='Estado de Conservación Física' value={estadoConservacion} onChange={(e) => setEstadoConservacion(e.target.value)} slotProps={{
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

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel id='select-calidad-label'>Calidad de Digitalización</InputLabel>
                        <Select startAdornment={<InputAdornment position='start'>
                            <Tooltip title={'Obligatorio'}>
                                <Emergency color='error' fontSize='small' />
                            </Tooltip>
                        </InputAdornment>} labelId='select-calidad-label' id='select-calidad' value={calidadDigitalizacion} label='Calidad de Digitalización' onChange={(e) => setCalidadDigitalizacion(e.target.value)}>
                            <MenuItem value={''}>Seleccione una opción</MenuItem>

                            {digitalizacion.map((value, index) => (
                                <MenuItem key={index} value={value.value}>{value.item}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField fullWidth variant='outlined' label='Fecha Aproximada del Documento' type='date' value={fechaAproximadaDocumento} onChange={(e) => setFechaAproximadaDocumento(e.target.value)} slotProps={{
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

                    <Box component={Paper} elevation={0} mb={2}>
                        <Box display={'flex'} alignItems={'center'}>
                            <Tooltip title={'Obligatorio'}>
                                <Emergency color='error' fontSize='small' />
                            </Tooltip>

                            <Typography color='textSecondary' variant='caption' ml={1}>Descripción del Contenido</Typography>
                        </Box>

                        <ReactQuill
                            value={descripcionContenido}
                            onChange={(content, delta, source, editor) => setDescripcionContenido(editor.getContents())}
                            modules={modules}
                            theme='snow'
                            placeholder='Escribe algo...'
                            style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                            className='rounded'
                        />
                    </Box>

                    <TextField fullWidth variant='outlined' label='familia Relacionada' value={familiaRelacionada} onChange={(e) => setFamiliaRelacionada(e.target.value)} slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <Tooltip title={'Obligatorio'}>
                                        <Emergency color='error' fontSize='small' />
                                    </Tooltip>
                                </InputAdornment>
                            ),
                        }
                    }} />
                </DialogContent>
                <DialogActions>
                    <Button variant='text' color='primary' onClick={handlePostDocument}>
                        <Typography variant='button'>Confirmar</Typography>
                    </Button>
                    <Button variant='text' color='inherit' onClick={() => setDialogCreate(false)}>
                        <Typography variant='button'>Cerrar</Typography>
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog onClose={() => setDialogUpdate(false)} open={dialogUpdate} maxWidth='md' fullWidth fullScreen={fullScreen}>
                <DialogTitle>Editar Documento</DialogTitle>
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

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel id='select-tipo-label'>Tipo de documento</InputLabel>
                        <Select startAdornment={<InputAdornment position='start'>
                            <Tooltip title={'Obligatorio'}>
                                <Emergency color='error' fontSize='small' />
                            </Tooltip>
                        </InputAdornment>} labelId='select-tipo-label' id='select-tipo' value={tipoDocumento} label='Tipo de documento' onChange={(e) => setTipoDocumento(e.target.value)}>
                            <MenuItem value={''}>Seleccione una opción</MenuItem>

                            {items.map((value, index) => (
                                <MenuItem key={index} value={value.value}>{value.item}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box mb={2}>
                        {documentos.length <= 0 ? (
                            <Button disableElevation variant='contained' component='label' startIcon={<InsertDriveFile />}>
                                <Typography variant='button'>Cargar documento</Typography>

                                <input type='file' accept='*.*' hidden onChange={(e) => {
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
                                            setDocumentos([]);
                                            setDocumentos(prev => [...prev, file]);
                                        };
                                        reader.readAsDataURL(myFiles[index]);
                                    });
                                }} />
                            </Button>
                        ) : (
                            <Fragment>
                                <Button disableElevation variant='contained' component='label' startIcon={<InsertDriveFile />}>
                                    <Typography variant='button'>Reemplazar documento cargado</Typography>

                                    <input type='file' accept='*.*' hidden multiple onChange={(e) => {
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
                                                setDocumentos([]);
                                                setDocumentos(prev => [...prev, file]);
                                            };
                                            reader.readAsDataURL(myFiles[index]);
                                        });
                                    }} />
                                </Button>

                                <Box display={'flex'} flexDirection={'column'} mt={2}>
                                    {documentos.length <= 0 ? (
                                        <Typography>No hay archivos cargados</Typography>
                                    ) : (
                                        <List component={Paper} elevation={0} variant='outlined' sx={{ textOverflow: 'ellipsis' }}>
                                            {documentos.map((file, index) => (
                                                <ListItem key={index} secondaryAction={
                                                    <Fragment>
                                                        <Tooltip title='Ver documento'>
                                                            <IconButton edge='end' onClick={() => window.open(file.url, '_blank')}>
                                                                <Visibility />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title='Eliminar documento' onClick={() => {
                                                            setDocumentos(prev => prev.filter((_, i) => i !== index));
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
                                                            <Attachment />
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
                    </Box>

                    <TextField fullWidth variant='outlined' label='Idioma Original de Documento' value={idiomaOriginal} onChange={(e) => setIdiomaOriginal(e.target.value)} slotProps={{
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

                    <TextField fullWidth variant='outlined' label='Estado de Conservación Física' value={estadoConservacion} onChange={(e) => setEstadoConservacion(e.target.value)} slotProps={{
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

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel id='select-calidad-label'>Calidad de Digitalización</InputLabel>
                        <Select startAdornment={<InputAdornment position='start'>
                            <Tooltip title={'Obligatorio'}>
                                <Emergency color='error' fontSize='small' />
                            </Tooltip>
                        </InputAdornment>} labelId='select-calidad-label' id='select-calidad' value={calidadDigitalizacion} label='Calidad de Digitalización' onChange={(e) => setCalidadDigitalizacion(e.target.value)}>
                            <MenuItem value={''}>Seleccione una opción</MenuItem>

                            {digitalizacion.map((value, index) => (
                                <MenuItem key={index} value={value.value}>{value.item}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField fullWidth variant='outlined' label='Fecha Aproximada del Documento' type='date' value={fechaAproximadaDocumento} onChange={(e) => setFechaAproximadaDocumento(e.target.value)} slotProps={{
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

                    <Box component={Paper} elevation={0} mb={2}>
                        <Box display={'flex'} alignItems={'center'}>
                            <Tooltip title={'Obligatorio'}>
                                <Emergency color='error' fontSize='small' />
                            </Tooltip>

                            <Typography color='textSecondary' variant='caption' ml={1}>Descripción del Contenido</Typography>
                        </Box>

                        <ReactQuill
                            value={descripcionContenido}
                            onChange={(content, delta, source, editor) => setDescripcionContenido(editor.getContents())}
                            modules={modules}
                            theme='snow'
                            placeholder='Escribe algo...'
                            style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                            className='rounded'
                        />
                    </Box>

                    <TextField fullWidth variant='outlined' label='familia Relacionada' value={familiaRelacionada} onChange={(e) => setFamiliaRelacionada(e.target.value)} slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <Tooltip title={'Obligatorio'}>
                                        <Emergency color='error' fontSize='small' />
                                    </Tooltip>
                                </InputAdornment>
                            ),
                        }
                    }} />
                </DialogContent>
                <DialogActions>
                    <Button variant='text' color='primary' onClick={handlePutDocument}>
                        <Typography variant='button'>Confirmar</Typography>
                    </Button>
                    <Button variant='text' color='inherit' onClick={() => setDialogUpdate(false)}>
                        <Typography variant='button'>Cerrar</Typography>
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog onClose={() => setDialogDelete(false)} open={dialogDelete} maxWidth='md' fullScreen={fullScreen}>
                <DialogTitle>Eliminar Documento</DialogTitle>
                <DialogContent>
                    {selectedData === null ? (
                        <Box component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                            <Warning fontSize='large' color='warning' />
                            <Typography ml={2}>Seleccione un documento para continuar</Typography>
                        </Box>
                    ) : (
                        <Fragment>
                            <Typography textAlign={'justify'}>¿Esta seguro de eliminar el documento <b>{items.filter(x => String(x.value) === String(decryptMessage(selectedData.tipo_documento)))[0].item} ({decryptMessage(selectedData.nombre)})</b> del sistema?, una vez eliminada deberá crearla nuevamente si desea restablecerla.</Typography>
                            <Typography textAlign={'justify'} mt={2}>Si está de acuerdo, pulse <Typography variant='button' color='primary'>CONFIRMAR</Typography>. Si no es así, pulse <Typography variant='button' color='textPrimary'>CERRAR</Typography>.</Typography>
                        </Fragment>
                    )}
                </DialogContent>
                <DialogActions>
                    {selectedData !== null && (
                        <Button variant='text' color='primary' onClick={handleDeleteDocument}>
                            <Typography variant='button'>Confirmar</Typography>
                        </Button>
                    )}

                    <Button variant='text' color='inherit' onClick={() => setDialogDelete(false)}>
                        <Typography variant='button'>Cerrar</Typography>
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog onClose={() => setDialogDetail(false)} open={dialogDetail} maxWidth='md' fullScreen={fullScreen}>
                <DialogTitle>Detalles del Documento</DialogTitle>
                <DialogContent>
                    {selectedData === null ? (
                        <Box component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                            <Warning fontSize='large' color='warning' />
                            <Typography ml={2}>Seleccione un documento para continuar</Typography>
                        </Box>
                    ) : (
                        <Fragment>
                            <Box component={Paper} elevation={0} variant='outlined' overflow={'auto'} m={'auto'}>
                                <TableContainer>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 900, bgcolor: grey['100'] }}>Tipo de Documento</TableCell>
                                                <TableCell>{items.filter(x => String(x.value) === String(decryptMessage(selectedData.tipo_documento)))[0].item}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 900, bgcolor: grey['100'] }}>Idioma Original del Documento</TableCell>
                                                <TableCell>{decryptMessage(selectedData.idioma_original)}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 900, bgcolor: grey['100'] }}>Estado de Conservación del Documento</TableCell>
                                                <TableCell>{decryptMessage(selectedData.estado_conservacion)}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 900, bgcolor: grey['100'] }}>Calidad de digitalización del Documento</TableCell>
                                                <TableCell>{digitalizacion.filter(x => String(x.value) === String(decryptMessage(selectedData.calidad_digitalizacion)))[0].item}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 900, bgcolor: grey['100'] }}>Fecha Aproximada del Documento</TableCell>
                                                <TableCell>{decryptMessage(selectedData.fecha_aproximada)}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 900, bgcolor: grey['100'] }}>Familia Relacionada</TableCell>
                                                <TableCell>{decryptMessage(selectedData.familia_relacionada)}</TableCell>
                                            </TableRow>
                                            <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 }, }}>
                                                <TableCell sx={{ fontWeight: 900, bgcolor: grey['100'] }}>Documento</TableCell>
                                                <TableCell>
                                                    <Button variant='text' color='primary' size='small' startIcon={<ExitToApp />} onClick={() => handleGetDocument(selectedData.id, decryptMessage(selectedData.nombre))}>
                                                        <Typography variant='button'>Ver documento</Typography>
                                                    </Button>
                                                </TableCell>
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
                                                <TableCell sx={{ fontWeight: 900, bgcolor: grey['100'] }}>Descripción del Contenido</TableCell>
                                            </TableRow>
                                            <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 }, }}>
                                                <ReactQuill
                                                    value={JSON.parse(decryptMessage(selectedData.descripcion_contenido))}
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
        </Fragment>
    )
};

export default DocumentacionHistorica;
