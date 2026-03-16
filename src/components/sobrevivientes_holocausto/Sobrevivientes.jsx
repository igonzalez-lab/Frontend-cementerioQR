import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Alert, Avatar, Box, Button, CircularProgress, Collapse, FormControl, IconButton, InputLabel, List, ListItem, ListItemIcon, ListItemText, Paper, TextField, Tooltip, Typography } from '@mui/material';
import { Attachment, Close, Delete, Edit, Emergency, InsertDriveFile, Visibility } from '@mui/icons-material';
import { blue, common } from '@mui/material/colors';

import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';

import { SHOW_ERROR_MESSAGE, SHOW_SUCCESS_MESSAGE } from '../../slices/notificationSlice';
import { decryptMessage, encryptMessage } from '../../helpers/helpers';

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

const Sobrevivientes = ({ people, survive, viewOnly }) => {
    const dispatch = useDispatch();
    const containerRef = useRef(null);
    const token = useSelector((state) => state.user_cementerio_qr.data);

    const [width, setWidth] = useState(0);
    const [cargando, setCargando] = useState(false);
    const [openDanger, setOpenDanger] = useState(true);

    const [fechaLiberacion, setFechaLiberacion] = useState('');
    const [campoConcentracionGueto, setCampoConcentracionGueto] = useState('');

    const [documentos, setDocumentos] = useState([]);

    const [reconocimientos, setReconocimientos] = useState({});
    const [focusedReconocimientos, setFocusedReconocimientos] = useState(false);

    const [testimonioPersonal, setTestimonioPersonal] = useState({});
    const [focusedTestimonioPersonal, setFocusedTestimonioPersonal] = useState(false);

    const [estadoVerificacion, setEstadoVerificacion] = useState({});
    const [focusedEstadoVerificacion, setFocusedEstadoVerificacion] = useState(false);


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

    const handleGetSurviveData = useCallback(async () => {
        try {
            setCargando(true);

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'people_id': encryptMessage(String(people.id))
            });

            const requestOptions = {
                method: 'POST',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/survive/survive-data`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            if (responseJson.message !== null) {
                setCampoConcentracionGueto(decryptMessage(responseJson.message.campo_concentracion_gueto));
                setFechaLiberacion(decryptMessage(responseJson.message.fecha_liberacion));
                setTestimonioPersonal(JSON.parse(decryptMessage(responseJson.message.testimonio_personal)));

                const misDocumentos = [];

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

                responseJson.message.documentacion.map((value, index) => {
                    const fileId = value.id;
                    const fileBase64 = value.base64;
                    const fileName = decryptMessage(value.nombre);
                    const fileExtension = fileName.split('.').pop().toLowerCase();
                    const fileMimeType = mimeTypes[fileExtension] || 'application/octet-stream';

                    const blob = base64ToBlob(`data:${fileMimeType};base64,${fileBase64}`);
                    const fileUrl = URL.createObjectURL(blob);

                    const miDocumento = {
                        id: fileId,
                        url: fileUrl,
                        name: fileName,
                        base64: fileBase64,
                        sobreviviente: 'SI'
                    }

                    misDocumentos.push(miDocumento);
                });

                setDocumentos(misDocumentos);
                setReconocimientos(JSON.parse(decryptMessage(responseJson.message.reconocimientos_recibidos)));
                setEstadoVerificacion(JSON.parse(decryptMessage(responseJson.message.estado_verificacion)));
            }
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
        finally {
            setCargando(false);
        }
    }, [people, token, dispatch, setCargando, encryptMessage, decryptMessage, setDocumentos, setReconocimientos, setFechaLiberacion, setEstadoVerificacion, setTestimonioPersonal, setCampoConcentracionGueto]);

    const handlePutSurviveData = useCallback(async () => {
        try {
            setCargando(true);

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'people_id': encryptMessage(String(people.id)),
                'fecha_liberacion': encryptMessage(fechaLiberacion),
                'estado_verificacion': encryptMessage(JSON.stringify(estadoVerificacion)),
                'testimonio_personal': encryptMessage(JSON.stringify(testimonioPersonal)),
                'campo_concentracion_gueto': encryptMessage(campoConcentracionGueto),
                'reconocimientos_recibidos': encryptMessage(JSON.stringify(reconocimientos)),
                'documentacion_sobrevivencia': encryptMessage(JSON.stringify(documentos))
            });

            const requestOptions = {
                method: 'PUT',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/survive/survive-data`, requestOptions);
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
    }, [people, token, fechaLiberacion, estadoVerificacion, testimonioPersonal, campoConcentracionGueto, reconocimientos, documentos, dispatch, setCargando, encryptMessage, decryptMessage]);


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
        handleGetSurviveData();
    }, [handleGetSurviveData]);

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
                                    <Button disableElevation variant='contained' color='primary' startIcon={<Edit />} onClick={handlePutSurviveData}>
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
                            <TextField fullWidth variant='outlined' type='text' label={<Box display={'flex'} alignItems={'center'}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                                Campo de concentración o gueto
                            </Box>} value={campoConcentracionGueto} disabled={viewOnly} onChange={(e) => setCampoConcentracionGueto(e.target.value)} sx={{ mb: 2 }} />

                            <TextField fullWidth variant='outlined' type='date' label={<Box display={'flex'} alignItems={'center'}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                                Fecha de liberación
                            </Box>} value={fechaLiberacion} disabled={viewOnly} onChange={(e) => setFechaLiberacion(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ mb: 2 }} />

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedTestimonioPersonal ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                    <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                    Testimonio personal completo
                                </InputLabel>

                                <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                    <ReactQuill
                                        value={testimonioPersonal}
                                        onChange={(content, delta, source, editor) => setTestimonioPersonal(editor.getContents())}
                                        modules={modules}
                                        theme='snow'
                                        placeholder='Escribe algo...'
                                        style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                        onFocus={() => setFocusedTestimonioPersonal(true)}
                                        onBlur={() => setFocusedTestimonioPersonal(false)}
                                        readOnly={viewOnly}
                                        className='rounded'
                                    />
                                </Box>
                            </FormControl>

                            <Box mb={2}>
                                {documentos.length <= 0 ? (
                                    !viewOnly && (
                                        <Button disableElevation variant='contained' component='label' startIcon={<InsertDriveFile />}>
                                            <Typography variant='button'>Cargar documentos de sobrevivencia</Typography>

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
                                    )
                                ) : (
                                    <Fragment>
                                        {!viewOnly && (
                                            <Button disableElevation variant='contained' component='label' startIcon={<InsertDriveFile />}>
                                                <Typography variant='button'>Cargar más documentos de sobrevivencia</Typography>

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

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedReconocimientos ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                    <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                    Reconocimientos recibidos
                                </InputLabel>

                                <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                    <ReactQuill
                                        value={reconocimientos}
                                        onChange={(content, delta, source, editor) => setReconocimientos(editor.getContents())}
                                        modules={modules}
                                        theme='snow'
                                        placeholder='Escribe algo...'
                                        style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                        onFocus={() => setFocusedReconocimientos(true)}
                                        onBlur={() => setFocusedReconocimientos(false)}
                                        readOnly={viewOnly}
                                        className='rounded'
                                    />
                                </Box>
                            </FormControl>

                            <FormControl fullWidth>
                                <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedEstadoVerificacion ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                    <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                    Estado de verificación oficial
                                </InputLabel>

                                <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                    <ReactQuill
                                        value={estadoVerificacion}
                                        onChange={(content, delta, source, editor) => setEstadoVerificacion(editor.getContents())}
                                        modules={modules}
                                        theme='snow'
                                        placeholder='Escribe algo...'
                                        style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                        onFocus={() => setFocusedEstadoVerificacion(true)}
                                        onBlur={() => setFocusedEstadoVerificacion(false)}
                                        readOnly={viewOnly}
                                        className='rounded'
                                    />
                                </Box>
                            </FormControl>
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

export default Sobrevivientes;
