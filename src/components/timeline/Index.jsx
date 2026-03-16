import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as LinkRRD } from 'react-router-dom';

import { Alert, AlertTitle, Link as LinkMUI, Box, Breadcrumbs, Button, CircularProgress, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Slider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Add, ArrowBack, Close, Delete, Edit, Emergency, Home, LinearScale, Refresh, Warning } from '@mui/icons-material';
import { common } from '@mui/material/colors';

import { SHOW_ERROR_MESSAGE, SHOW_SUCCESS_MESSAGE } from '../../slices/notificationSlice';
import { decryptMessage, encryptMessage } from '../../helpers/helpers';
import { jwtDecode } from 'jwt-decode';

import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';

const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
];

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

export default function Index({ people, viewOnly, personal }) {
    const theme = useTheme();
    const dispatch = useDispatch();
    const containerRef = useRef(null);
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const token = useSelector((state) => state.user_cementerio_qr.data);
    const mobileScreen = useMediaQuery(theme.breakpoints.between('xs', 'sm'));

    const [data, setData] = useState(null);
    const [dataError, setDataError] = useState(false);
    const [dataErrorMessage, setDataErrorMessage] = useState('');

    const [width, setWidth] = useState(0);
    const [openDanger, setOpenDanger] = useState(true);
    const [dialogCreate, setDialogCreate] = useState(false);
    const [dialogUpdate, setDialogUpdate] = useState(false);
    const [dialogDelete, setDialogDelete] = useState(false);
    const [selectedData, setSelectedData] = useState(null);
    const [focusedDescripcion, setFocusedDescripcion] = useState(false);


    const [selectedYear, setSelectedYear] = useState(() => {
        if (data !== null) {
            const years = data.map((x) => parseInt(decryptMessage(x.ano)));
            return years.length ? Math.max(...years) : new Date().getFullYear();
        }
    });

    const [form, setForm] = useState({
        year: selectedYear,
        month: 1,
        name: '',
        description: {}
    });

    const years = useMemo(() => {
        if (data !== null) {
            if (data.length <= 0) {
                return { min: 1900, max: new Date().getFullYear() };
            }

            const years = data.map((x) => parseInt(decryptMessage(x.ano)));
            return { min: Math.min(...years), max: Math.max(...years) };
        }
    }, [data]);

    const yearRecords = useMemo(() => {
        if (data !== null) {
            return data
                .filter((x) => parseInt(decryptMessage(x.ano)) === selectedYear)
                .sort((a, b) => (parseInt(decryptMessage(a.mes)) - parseInt(decryptMessage(b.month))) || decryptMessage(a.nombre).localeCompare(decryptMessage(b.nombre)));
        }
    }, [data, selectedYear]);

    const handleOpenDialogUpdate = useCallback((payload) => {
        setForm((p) => ({ ...p, name: decryptMessage(payload.nombre) }));
        setForm((p) => ({ ...p, description: JSON.parse(decryptMessage(payload.descripcion)) }));

        setSelectedData(payload);
        setDialogUpdate(true);
    }, [setDialogUpdate, setSelectedData]);

    const handleOpenDialogDelete = useCallback((payload) => {
        setForm((p) => ({ ...p, name: decryptMessage(payload.nombre) }));
        setForm((p) => ({ ...p, description: JSON.parse(decryptMessage(payload.descripcion)) }));

        setSelectedData(payload);
        setDialogDelete(true);
    }, [setDialogDelete, setSelectedData]);


    const handleGetTimeline = useCallback(async (id) => {
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

            let path = '';

            if (personal) {
                path = `${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/timeline/people/${id}`
            } else {
                path = `${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/timeline/general`
            }

            const response = await fetch(path, requestOptions);
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

    const handlePostTimeline = useCallback(async () => {
        try {
            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'name': encryptMessage(form.name.trim()),
                'year': encryptMessage(String(form.year).trim()),
                'month': encryptMessage(String(form.month).trim()),
                'people_id': encryptMessage(personal ? String(people.id).trim() : '0'),
                'is_general': encryptMessage(personal ? 'NO' : 'SI'),
                'description': encryptMessage(JSON.stringify(form.description))
            });

            const requestOptions = {
                method: 'POST',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/timeline/`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setForm((p) => ({ ...p, name: '' }));
            setForm((p) => ({ ...p, description: {} }));

            setDialogCreate(false);
            dispatch(SHOW_SUCCESS_MESSAGE(responseJson.message));

            handleGetTimeline(people === null ? null : people.id);
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [form, token, people, personal, setForm, dispatch, setDialogCreate, encryptMessage, decryptMessage, handleGetTimeline]);

    const handlePutTimeline = useCallback(async () => {
        try {
            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'id': encryptMessage(String(selectedData?.id).trim()),
                'name': encryptMessage(form.name.trim()),
                'description': encryptMessage(JSON.stringify(form.description))
            });

            const requestOptions = {
                method: 'PUT',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/timeline/`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setForm((p) => ({ ...p, name: '' }));
            setForm((p) => ({ ...p, description: {} }));

            setDialogUpdate(false);
            dispatch(SHOW_SUCCESS_MESSAGE(responseJson.message));

            handleGetTimeline(people === null ? null : people.id);
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [form, token, selectedData, people, personal, setForm, dispatch, setDialogUpdate, encryptMessage, decryptMessage, handleGetTimeline]);

    const handleDeleteTimeline = useCallback(async () => {
        try {
            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'id': encryptMessage(String(selectedData?.id).trim())
            });

            const requestOptions = {
                method: 'DELETE',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/timeline/`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            setForm((p) => ({ ...p, name: '' }));
            setForm((p) => ({ ...p, description: {} }));

            setDialogDelete(false);
            dispatch(SHOW_SUCCESS_MESSAGE(responseJson.message));

            handleGetTimeline(people === null ? null : people.id);
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
    }, [form, token, selectedData, people, personal, setForm, dispatch, setDialogUpdate, encryptMessage, decryptMessage, handleGetTimeline]);


    useEffect(() => {
        setForm((p) => ({ ...p, year: selectedYear }));
    }, [selectedYear]);

    useEffect(() => {
        handleGetTimeline(people === null ? null : people.id);
    }, [people]);

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

    return (
        <Box maxWidth={mobileScreen ? '87vw' : '100%'} ref={containerRef}>
            {people === null && (
                <Fragment>
                    <Box display={'flex'} alignItems={'center'}>
                        <LinearScale fontSize='large' />
                        <Typography variant='h4' ml={1}>Linea de Tiempo General</Typography>
                    </Box>

                    <Box role='presentation' onClick={(e) => e.preventDefault()} mb={2}>
                        <Breadcrumbs maxItems={5}>
                            <LinkMUI underline='hover' color='textSecondary' display={'flex'} alignItems={'center'} component={LinkRRD} to={'/'}>
                                <Home sx={{ mr: 0.5 }} fontSize='inherit' />
                                <Typography>Menú Principal</Typography>
                            </LinkMUI>
                            <LinkMUI underline='hover' color='textPrimary' display={'flex'} alignItems={'center'} component={LinkRRD} to={'/linea-tiempo'}>
                                <LinearScale sx={{ mr: 0.5 }} fontSize='inherit' />
                                <Typography>Linea de Tiempo General</Typography>
                            </LinkMUI>
                        </Breadcrumbs>
                    </Box>
                </Fragment>
            )}

            <Alert severity='info' sx={{ mb: 2 }}>
                <AlertTitle>Línea de tiempo (por año)</AlertTitle>
                Arrastra el año para ver los registros. Ejemplo: Si te vas a 2006, verás todo lo de 2006.
            </Alert>

            <Box display={'flex'} alignItems={'center'} flexWrap={'wrap'} mt={2}>
                {people === null && (
                    <Button disableElevation variant='contained' color='info' startIcon={<ArrowBack />} sx={{ mr: 2, mb: 2 }} component={LinkRRD} to={'/'}>
                        <Typography variant='button'>Volver a Menú Principal</Typography>
                    </Button>
                )}

                {!viewOnly && (
                    String(decryptMessage(jwtDecode(decryptMessage(token)).role)) === '5' && (
                        <Button disableElevation variant='contained' color='primary' startIcon={<Add />} sx={{ mb: 2 }} onClick={() => setDialogCreate(true)}>
                            <Typography variant='button'>Agregar nuevo item al Timeline</Typography>
                        </Button>
                    )
                )}
            </Box>

            <Alert severity='success' sx={{ mb: 2 }}>
                <AlertTitle>Timeline</AlertTitle>
                Año seleccionado: <b>{selectedYear}</b> {data !== null && data.length === 1 && '(Ingrese mas de 1 elemento al timeline para tener un rango de búsqueda, actualmente tiene solo 1 registro)'}
            </Alert>

            <Typography fontWeight={900}>Slider de año (Arrastre para buscar)</Typography>

            {years !== undefined && (
                <Slider min={years.min} max={years.max} value={selectedYear} defaultValue={50} onChange={(e) => setSelectedYear(Number(e.target.value))} valueLabelDisplay='auto' />
            )}

            {dataError ? (
                <Box component={Paper} elevation={0} variant='outlined' display={'flex'} flexDirection={'column'} justifyContent={'center'} p={2}>
                    <Box display={'flex'} alignItems={'center'} mb={1}>
                        <Warning color='warning' fontSize='large' />
                        <Typography ml={1}>Error al obtener los datos: {dataErrorMessage}</Typography>
                    </Box>
                    <Button disableElevation variant='contained' color='primary' startIcon={<Refresh />} sx={{ width: 'fit-content' }} onClick={() => handleGetTimeline(people === null ? null : people.id)}>
                        <Typography variant='button'>Consultar nuevamente</Typography>
                    </Button>
                </Box>
            ) : data === null ? (
                <Box component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                    <CircularProgress />
                    <Typography ml={2}>Cargando datos</Typography>
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={0} variant='outlined'>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Mes</TableCell>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Descripción</TableCell>
                                {!viewOnly && (
                                    <Fragment>
                                        <TableCell />
                                        <TableCell />
                                    </Fragment>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {yearRecords.length === 0 ? (
                                <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell colSpan={4} sx={{ textAlign: 'center' }}>No hay registros en este año</TableCell>
                                </TableRow>
                            ) : (
                                yearRecords.map((r) => (
                                    <TableRow key={r.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell>{months.find((x) => x.value === parseInt(decryptMessage(r.mes))).label}</TableCell>
                                        <TableCell>{decryptMessage(r.nombre)}</TableCell>
                                        <TableCell>
                                            <ReactQuill
                                                value={JSON.parse(decryptMessage(r.descripcion))}
                                                theme={null}
                                                readOnly={true}
                                            />
                                        </TableCell>
                                        {!viewOnly && (
                                            String(decryptMessage(jwtDecode(decryptMessage(token)).role)) === '5' && (
                                                <Fragment>
                                                    <TableCell>
                                                        <Button variant='text' color='warning' startIcon={<Edit />} onClick={() => handleOpenDialogUpdate(r)}>
                                                            <Typography variant='button'>Editar</Typography>
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant='text' color='error' startIcon={<Delete />} onClick={() => handleOpenDialogDelete(r)}>
                                                            <Typography variant='button'>Eliminar</Typography>
                                                        </Button>
                                                    </TableCell>
                                                </Fragment>
                                            )
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog onClose={() => setDialogCreate(false)} open={dialogCreate} maxWidth='md' fullWidth fullScreen={fullScreen}>
                <DialogTitle>Nuevo Item al Timeline</DialogTitle>
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

                    <TextField fullWidth variant='outlined' type='number' label={<Box display={'flex'} alignItems={'center'}>
                        <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                        Año (se ajusta al año actual del timeline)
                    </Box>} value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))} sx={{ mb: 2 }} />

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel id='select-mes-label'>
                            <Box display={'flex'} alignItems={'center'}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                                Mes
                            </Box>
                        </InputLabel>
                        <Select labelId='select-mes-label' id='select-mes' value={form.month} label='*** Mes' onChange={(e) => setForm((p) => ({ ...p, month: Number(e.target.value) }))}>
                            {months.map((m) => (
                                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField fullWidth variant='outlined' label={<Box display={'flex'} alignItems={'center'}>
                        <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                        Nombre
                    </Box>} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} sx={{ mb: 2 }} />

                    <FormControl fullWidth>
                        <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedDescripcion ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                            <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                            Descripción
                        </InputLabel>

                        <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                            <ReactQuill
                                value={form.description}
                                onChange={(content, delta, source, editor) => setForm((p) => ({ ...p, description: editor.getContents() }))}
                                modules={modules}
                                theme='snow'
                                placeholder='Escribe algo...'
                                style={{ width: 850, fontFamily: 'Roboto, sans-serif' }}
                                onFocus={() => setFocusedDescripcion(true)}
                                onBlur={() => setFocusedDescripcion(false)}
                                readOnly={viewOnly}
                                className='rounded'
                            />
                        </Box>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button variant='text' color='primary' onClick={handlePostTimeline}>
                        <Typography variant='button'>Confirmar</Typography>
                    </Button>
                    <Button variant='text' color='inherit' onClick={() => setDialogCreate(false)}>
                        <Typography variant='button'>Cerrar</Typography>
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog onClose={() => setDialogUpdate(false)} open={dialogUpdate} maxWidth='md' fullWidth fullScreen={fullScreen}>
                <DialogTitle>Actualizar Item de Timeline</DialogTitle>
                <DialogContent>
                    {selectedData !== null && (
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

                            <Alert severity='info' sx={{ mb: 2 }}>
                                <AlertTitle>Periodo de este item del Timeline</AlertTitle>
                                {months.find((x) => x.value === parseInt(decryptMessage(selectedData.mes))).label} del año {decryptMessage(selectedData.ano)}
                            </Alert>

                            <TextField fullWidth variant='outlined' label={<Box display={'flex'} alignItems={'center'}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                                Nombre
                            </Box>} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} sx={{ mb: 2 }} />

                            <FormControl fullWidth>
                                <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedDescripcion ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                    <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                    Descripción
                                </InputLabel>

                                <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                    <ReactQuill
                                        value={form.description}
                                        onChange={(content, delta, source, editor) => setForm((p) => ({ ...p, description: editor.getContents() }))}
                                        modules={modules}
                                        theme='snow'
                                        placeholder='Escribe algo...'
                                        style={{ width: 850, fontFamily: 'Roboto, sans-serif' }}
                                        onFocus={() => setFocusedDescripcion(true)}
                                        onBlur={() => setFocusedDescripcion(false)}
                                        readOnly={viewOnly}
                                        className='rounded'
                                    />
                                </Box>
                            </FormControl>
                        </Fragment>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button variant='text' color='primary' onClick={handlePutTimeline}>
                        <Typography variant='button'>Confirmar</Typography>
                    </Button>
                    <Button variant='text' color='inherit' onClick={() => setDialogUpdate(false)}>
                        <Typography variant='button'>Cerrar</Typography>
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog onClose={() => setDialogDelete(false)} open={dialogDelete} maxWidth='md' fullWidth fullScreen={fullScreen}>
                <DialogTitle>Eliminar Item de Timeline</DialogTitle>
                <DialogContent>
                    {selectedData !== null && (
                        <Fragment>
                            <Alert severity='warning' sx={{ mb: 2 }}>
                                <AlertTitle>Periodo de este item del Timeline</AlertTitle>
                                Esta seguro de eliminar el siguiente periodo en {months.find((x) => x.value === parseInt(decryptMessage(selectedData.mes))).label} del año {decryptMessage(selectedData.ano)}
                            </Alert>

                            <TextField fullWidth variant='outlined' label='Nombre' value={form.name} sx={{ mb: 2 }} />

                            <FormControl fullWidth>
                                <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedDescripcion ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                    Descripción
                                </InputLabel>

                                <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                    <ReactQuill
                                        value={form.description}
                                        modules={modules}
                                        theme='snow'
                                        placeholder='Escribe algo...'
                                        style={{ width: 850, fontFamily: 'Roboto, sans-serif' }}
                                        onFocus={() => setFocusedDescripcion(true)}
                                        onBlur={() => setFocusedDescripcion(false)}
                                        readOnly={true}
                                        className='rounded'
                                    />
                                </Box>
                            </FormControl>
                        </Fragment>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button variant='text' color='primary' onClick={handleDeleteTimeline}>
                        <Typography variant='button'>Confirmar</Typography>
                    </Button>
                    <Button variant='text' color='inherit' onClick={() => setDialogDelete(false)}>
                        <Typography variant='button'>Cerrar</Typography>
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
};
