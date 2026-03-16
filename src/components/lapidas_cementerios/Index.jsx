import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { SHOW_ERROR_MESSAGE, SHOW_SUCCESS_MESSAGE } from '../../slices/notificationSlice';
import { decryptMessage, encryptMessage } from '../../helpers/helpers';
import { useDispatch, useSelector } from 'react-redux';

import { Alert, Box, Button, CircularProgress, Collapse, FormControl, IconButton, InputLabel, Paper, TextField, Tooltip, Typography } from '@mui/material';
import { Close, Edit, Emergency } from '@mui/icons-material';
import { common } from '@mui/material/colors';

import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';
import { debounce } from 'lodash';

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

const Index = ({ people, viewOnly }) => {
    const dispatch = useDispatch();
    const containerRef = useRef(null);
    const token = useSelector((state) => state.user_cementerio_qr.data);

    const [width, setWidth] = useState(0);
    const [loading, setLoading] = useState(false);
    const [openDanger, setOpenDanger] = useState(true);

    const [textoHebreo, setTextoHebreo] = useState('');
    const [textoEspanol, setTextoEspanol] = useState('');

    const [simbolosUtilizados, setSimbolosUtilizados] = useState({});
    const [focusedSimbolosUtilizados, setFocusedSimbolosUtilizados] = useState(false);

    const [fechaColocacion, setFechaColocacion] = useState('');

    const [materialConstruccion, setMaterialConstruccion] = useState({});
    const [focusedMaterialConstruccion, setFocusedMaterialConstruccion] = useState(false);

    const [estadoConservacionActual, setEstadoConservacionActual] = useState({});
    const [focusedEstadoConservacionActual, setFocusedEstadoConservacionActual] = useState(false);


    const handleGetData = useCallback(async () => {
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

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/lapidas/data/${people.id}`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            if (responseJson.message !== null) {
                setTextoHebreo(decryptMessage(responseJson.message.texto_hebreo));
                setTextoEspanol(decryptMessage(responseJson.message.texto_espanol));
                setSimbolosUtilizados(JSON.parse(decryptMessage(responseJson.message.simbolos_utilizados)));
                setFechaColocacion(decryptMessage(responseJson.message.fecha_colocacion));
                setMaterialConstruccion(JSON.parse(decryptMessage(responseJson.message.material_construccion)));
                setEstadoConservacionActual(JSON.parse(decryptMessage(responseJson.message.estado_conservacion)));
            }
        } catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        } finally {
            setLoading(false);
        }
    }, [token, people, setLoading, dispatch, decryptMessage, setTextoHebreo, setTextoEspanol, setSimbolosUtilizados, setFechaColocacion, setMaterialConstruccion, setEstadoConservacionActual]);

    const handlePutData = useCallback(async () => {
        try {
            setLoading(true);

            if (textoHebreo === '') {
                throw new Error('Complete el texto en hebreo');
            }

            if (textoEspanol === '') {
                throw new Error('Complete el texto en español');
            }

            if (fechaColocacion === '') {
                throw new Error('Complete la Fecha de colocación');
            }

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'people_id': encryptMessage(String(people.id)),
                'hebrew_text': encryptMessage(textoHebreo.trim()),
                'spanish_text': encryptMessage(textoEspanol.trim()),
                'date_colocation': encryptMessage(fechaColocacion.trim()),
                'symbols_utilized': encryptMessage(JSON.stringify(simbolosUtilizados)),
                'conservation_state': encryptMessage(JSON.stringify(estadoConservacionActual)),
                'material_construction': encryptMessage(JSON.stringify(materialConstruccion)),
            });

            const requestOptions = {
                method: 'PUT',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/lapidas/data`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            dispatch(SHOW_SUCCESS_MESSAGE(responseJson.message));
        } catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        } finally {
            setLoading(false);
        }
    }, [token, people, textoHebreo, textoEspanol, fechaColocacion, simbolosUtilizados, estadoConservacionActual, materialConstruccion, dispatch, setLoading, decryptMessage, encryptMessage]);

    const translateLanguages = useCallback(async (text, origin, destiny) => {
        if (!text.trim()) {
            return ''
        };

        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(origin)}&tl=${encodeURIComponent(destiny)}&dt=t&q=${encodeURIComponent(text)}`;
            const response = await fetch(url);
            const responseData = await response.json();

            return responseData[0][0][0];
        } catch (e) {
            return text;
        }
    }, []);

    const debouncedTranslateHebrew = useCallback(debounce(async (value) => {
        const result = await translateLanguages(value, 'es', 'he');
        setTextoHebreo(result);
    }, 500), [translateLanguages, setTextoHebreo]);


    useEffect(() => {
        debouncedTranslateHebrew(textoEspanol);
    }, [textoEspanol, debouncedTranslateHebrew]);

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
        handleGetData();
    }, [handleGetData]);

    return (
        <Fragment>
            {loading ? (
                <Box component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                    <CircularProgress />
                    <Typography ml={2}>Procesando, espere...</Typography>
                </Box>
            ) : (
                <Fragment>
                    {!viewOnly && (
                        <Fragment>
                            <Box mb={2} position={'sticky'} top={130} zIndex={9} width={'fit-content'}>
                                <Button disableElevation variant='contained' color='primary' startIcon={<Edit />} onClick={handlePutData}>
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
                        {!viewOnly && (
                            <Alert severity='info' sx={{ mb: 2 }}>A medida que <b>escribas el texto en español</b> de la lápida, se irá completando el <b>texto en hebreo de la lápida de forma automática</b></Alert>
                        )}

                        <TextField disabled={viewOnly} fullWidth variant='outlined' type='text' label={<Box display={'flex'} alignItems={'center'}>
                            <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                            Texto en español de la lápida
                        </Box>} value={textoEspanol} onChange={(e) => setTextoEspanol(e.target.value)} sx={{ mb: 2 }} />

                        <TextField disabled fullWidth variant='outlined' type='text' label={<Box display={'flex'} alignItems={'center'}>
                            <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                            Texto en hebreo de la lápida
                        </Box>} value={textoHebreo} sx={{ mb: 2 }} />

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedSimbolosUtilizados ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                Símbolos utilizados
                            </InputLabel>

                            <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                <ReactQuill
                                    value={simbolosUtilizados}
                                    onChange={(content, delta, source, editor) => setSimbolosUtilizados(editor.getContents())}
                                    modules={modules}
                                    theme='snow'
                                    placeholder='Escribe algo...'
                                    style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                    onFocus={() => setFocusedSimbolosUtilizados(true)}
                                    onBlur={() => setFocusedSimbolosUtilizados(false)}
                                    readOnly={viewOnly}
                                    className='rounded'
                                />
                            </Box>
                        </FormControl>

                        <TextField disabled={viewOnly} fullWidth variant='outlined' type='date' label={<Box display={'flex'} alignItems={'center'}>
                            <Emergency color='error' fontSize='small' sx={{ mr: 0.5 }} />
                            Fecha de colocación de la lápida
                        </Box>} value={fechaColocacion} onChange={(e) => setFechaColocacion(e.target.value)} sx={{ mb: 2 }} slotProps={{ inputLabel: { shrink: true } }} />

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedMaterialConstruccion ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                Material de construcción
                            </InputLabel>

                            <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                <ReactQuill
                                    value={materialConstruccion}
                                    onChange={(content, delta, source, editor) => setMaterialConstruccion(editor.getContents())}
                                    modules={modules}
                                    theme='snow'
                                    placeholder='Escribe algo...'
                                    style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                    onFocus={() => setFocusedMaterialConstruccion(true)}
                                    onBlur={() => setFocusedMaterialConstruccion(false)}
                                    readOnly={viewOnly}
                                    className='rounded'
                                />
                            </Box>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedEstadoConservacionActual ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                Estado de conservación actual
                            </InputLabel>

                            <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                <ReactQuill
                                    value={estadoConservacionActual}
                                    onChange={(content, delta, source, editor) => setEstadoConservacionActual(editor.getContents())}
                                    modules={modules}
                                    theme='snow'
                                    placeholder='Escribe algo...'
                                    style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                    onFocus={() => setFocusedEstadoConservacionActual(true)}
                                    onBlur={() => setFocusedEstadoConservacionActual(false)}
                                    readOnly={viewOnly}
                                    className='rounded'
                                />
                            </Box>
                        </FormControl>
                    </Box>
                </Fragment>
            )}
        </Fragment>
    )
};

export default Index;
