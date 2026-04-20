import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Alert, Avatar, Box, Button, CircularProgress, Collapse, FormControl, IconButton, InputLabel, List, ListItem, ListItemIcon, ListItemText, Paper, TextField, Tooltip, Typography } from '@mui/material';
import { Attachment, Close, Delete, Edit, Emergency, InsertDriveFile, Visibility } from '@mui/icons-material';
import { blue, common } from '@mui/material/colors';

import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';

import { SHOW_ERROR_MESSAGE, SHOW_SUCCESS_MESSAGE } from '../../slices/notificationSlice';

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

const Migracion = ({ people, survive, viewOnly }) => {
    const dispatch = useDispatch();
    const getDataFiles = useRef(true);
    const containerRef = useRef(null);
    const token = useSelector((state) => state.user_cementerio_qr.data);

    const [width, setWidth] = useState(0);
    const [cargando, setCargando] = useState(false);
    const [openDanger, setOpenDanger] = useState(true);

    const [rutaMigracion, setRutaMigracion] = useState({});
    const [focusedRutaMigracion, setFocusedRutaMigracion] = useState(false);

    const [paisesTransito, setPaisesTransito] = useState({});
    const [focusedPaisesTransito, setFocusedPaisesTransito] = useState(false);

    const [fechaLlegada, setFechaLlegada] = useState('');

    const [familiaresPerdidos, setFamiliaresPerdidos] = useState({});
    const [focusedFamiliaresPerdidos, setFocusedFamiliaresPerdidos] = useState(false);

    const [organizacionesAyuda, setOrganizacionesAyuda] = useState({});
    const [focusedOrganizacionesAyuda, setFocusedOrganizacionesAyuda] = useState(false);

    const [documentos, setDocumentos] = useState([]);


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

    async function urlToBase64(url) {
        const response = await fetch(url)
        const blob     = await response.blob()

        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.onerror   = reject
            reader.readAsDataURL(blob)
        })
    }

    const handleGetMigrationData = useCallback(async () => {
        try {
            if (!getDataFiles.current) {
                return
            }

            getDataFiles.current = false

            setCargando(true);
            setDocumentos([]);

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${token}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'people_id': String(people.id)
            });

            const requestOptions = {
                method: 'POST',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/survive/migration-data`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            if (responseJson.message !== null) {
                setRutaMigracion(JSON.parse(responseJson.message.ruta_migracion));
                setPaisesTransito(JSON.parse(responseJson.message.paises_transito));
                setFechaLlegada(responseJson.message.fecha_llegada);
                setFamiliaresPerdidos(JSON.parse(responseJson.message.familiares_perdidos));
                setOrganizacionesAyuda(JSON.parse(responseJson.message.organizaciones_ayuda));

                responseJson.message.documentacion.map(async (value, index) => {
                    const fileUrl = value.ruta;
                    const fileName = value.nombre;
                    
                    const fileBase64 = await urlToBase64(`${import.meta.env.VITE_BACKEND_ADDRESS}\\${fileUrl}`)
                    
                    const blob = base64ToBlob(fileBase64);
                    const url = URL.createObjectURL(blob);

                    const fileId = value.id;
                    
                    const miDocumento = {
                        id: fileId,
                        url: url,
                        name: fileName,
                        base64: fileBase64,
                        sobreviviente: 'SI'
                    }

                    setDocumentos(prev => [...prev, miDocumento]);
                });
            }
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
        finally {
            setCargando(false);
        }
    }, [people, token, dispatch, setCargando, setDocumentos, setRutaMigracion, setPaisesTransito, setFechaLlegada, setFamiliaresPerdidos, setOrganizacionesAyuda]);

    const handlePutMigrationData = useCallback(async () => {
        try {
            setCargando(true);

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${token}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'people_id': String(people.id),
                'ruta_migracion': JSON.stringify(rutaMigracion),
                'paises_transito': JSON.stringify(paisesTransito),
                'fecha_llegada': fechaLlegada,
                'familiares_perdidos': JSON.stringify(familiaresPerdidos),
                'organizaciones_ayuda': JSON.stringify(organizacionesAyuda),
                'documentacion_refugiado': JSON.stringify(documentos)
            });

            const requestOptions = {
                method: 'PUT',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/survive/migration-data`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            dispatch(SHOW_SUCCESS_MESSAGE(responseJson.message));
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
        finally {
            setCargando(false);
        }
    }, [people, token, rutaMigracion, paisesTransito, fechaLlegada, familiaresPerdidos, organizacionesAyuda, documentos, dispatch, setCargando]);


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
        if (getDataFiles.current) {
            handleGetMigrationData();
        }
    }, [handleGetMigrationData]);

    return (
        <Fragment>
            {survive ? (
                cargando ? (
                    <Box component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                        <CircularProgress />
                        <Typography ml={2}>Procesando, espere...</Typography>
                    </Box>
                ) : (
                    <Fragment>
                        {!viewOnly && (
                            <Fragment>
                                <Box mb={2} position={'sticky'} top={185} zIndex={9} width={'fit-content'}>
                                    <Button disableElevation variant='contained' color='primary' startIcon={<Edit />} onClick={handlePutMigrationData}>
                                        <Typography variant='button'>Actualizar datos</Typography>
                                    </Button>
                                </Box>

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
                            </Fragment>
                        )}

                        <Box ref={containerRef} component={Paper} elevation={0} variant='outlined' display={'flex'} flexDirection={'column'} p={2}>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedRutaMigracion ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                    <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                    Ruta de migración después de la guerra
                                </InputLabel>

                                <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                    <ReactQuill
                                        value={rutaMigracion}
                                        onChange={(content, delta, source, editor) => setRutaMigracion(editor.getContents())}
                                        modules={modules}
                                        theme='snow'
                                        placeholder='Escribe algo...'
                                        style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                        onFocus={() => setFocusedRutaMigracion(true)}
                                        onBlur={() => setFocusedRutaMigracion(false)}
                                        readOnly={viewOnly}
                                        className='rounded'
                                    />
                                </Box>
                            </FormControl>

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedPaisesTransito ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                    <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                    Países de tránsito
                                </InputLabel>

                                <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                    <ReactQuill
                                        value={paisesTransito}
                                        onChange={(content, delta, source, editor) => setPaisesTransito(editor.getContents())}
                                        modules={modules}
                                        theme='snow'
                                        placeholder='Escribe algo...'
                                        style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                        onFocus={() => setFocusedPaisesTransito(true)}
                                        onBlur={() => setFocusedPaisesTransito(false)}
                                        readOnly={viewOnly}
                                        className='rounded'
                                    />
                                </Box>
                            </FormControl>

                            <TextField fullWidth variant='outlined' type='date' label={<Box display={'flex'} alignItems={'center'}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                                Fecha de llegada a Chile
                            </Box>} value={fechaLlegada} disabled={viewOnly} onChange={(e) => setFechaLlegada(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ mb: 2 }} />

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedFamiliaresPerdidos ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                    <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                    Familiares perdidos en el Holocausto
                                </InputLabel>

                                <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                    <ReactQuill
                                        value={familiaresPerdidos}
                                        onChange={(content, delta, source, editor) => setFamiliaresPerdidos(editor.getContents())}
                                        modules={modules}
                                        theme='snow'
                                        placeholder='Escribe algo...'
                                        style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                        onFocus={() => setFocusedFamiliaresPerdidos(true)}
                                        onBlur={() => setFocusedFamiliaresPerdidos(false)}
                                        readOnly={viewOnly}
                                        className='rounded'
                                    />
                                </Box>
                            </FormControl>

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedOrganizacionesAyuda ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                    <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                    Organizaciones de ayuda que asistieron
                                </InputLabel>

                                <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                    <ReactQuill
                                        value={organizacionesAyuda}
                                        onChange={(content, delta, source, editor) => setOrganizacionesAyuda(editor.getContents())}
                                        modules={modules}
                                        theme='snow'
                                        placeholder='Escribe algo...'
                                        style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                        onFocus={() => setFocusedOrganizacionesAyuda(true)}
                                        onBlur={() => setFocusedOrganizacionesAyuda(false)}
                                        readOnly={viewOnly}
                                        className='rounded'
                                    />
                                </Box>
                            </FormControl>

                            <Box>
                                {documentos.length <= 0 ? (
                                    !viewOnly && (
                                        <Button disableElevation variant='contained' component='label' startIcon={<InsertDriveFile />}>
                                            <Typography variant='button'>Cargar documentos de refugiado</Typography>

                                            <input type='file' accept='*.*' hidden multiple onChange={(e) => {
                                                const myFiles = Array.from(e.target.files);
                                                const newFiles = myFiles.map(file => ({
                                                    id: null,
                                                    url: URL.createObjectURL(file),
                                                    name: file.name,
                                                    base64: null,
                                                    sobreviviente: 'NO'
                                                }));

                                                newFiles.forEach((file, index) => {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        file.base64 = reader.result.split(',')[1];
                                                        setDocumentos(prev => [...prev, file]);
                                                    };
                                                    reader.readAsDataURL(myFiles[index]);
                                                });
                                            }} />
                                        </Button>
                                    )
                                ) : (
                                    <Fragment>
                                        {!viewOnly && (
                                            <Button disableElevation variant='contained' component='label' startIcon={<InsertDriveFile />}>
                                                <Typography variant='button'>Cargar más documentos de refugiado</Typography>

                                                <input type='file' accept='*.*' hidden multiple onChange={(e) => {
                                                    const myFiles = Array.from(e.target.files);
                                                    const newFiles = myFiles.map(file => ({
                                                        id: null,
                                                        url: URL.createObjectURL(file),
                                                        name: file.name,
                                                        base64: null,
                                                        sobreviviente: 'SI'
                                                    }));

                                                    newFiles.forEach((file, index) => {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            file.base64 = reader.result.split(',')[1];
                                                            setDocumentos(prev => [...prev, file]);
                                                        };
                                                        reader.readAsDataURL(myFiles[index]);
                                                    });
                                                }} />
                                            </Button>
                                        )}

                                        <Box display={'flex'} flexDirection={'column'} mt={viewOnly ? 0 : 2}>
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
                                                                {!viewOnly && (
                                                                    <Tooltip title='Eliminar documento' onClick={() => {
                                                                        setDocumentos(prev => prev.filter((_, i) => i !== index));
                                                                        URL.revokeObjectURL(file.url);
                                                                    }}>
                                                                        <IconButton edge='end' sx={{ ml: 2 }}>
                                                                            <Delete />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}
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
                        </Box>
                    </Fragment>
                )
            ) : (
                <Alert severity='warning'>
                    Habilite la opción sobreviviente del holocausto para continuar
                </Alert>
            )}
        </Fragment>
    )
};

export default Migracion;
