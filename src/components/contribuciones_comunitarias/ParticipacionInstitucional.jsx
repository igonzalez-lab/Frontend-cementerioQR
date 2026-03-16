import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Alert, Box, Button, CircularProgress, Collapse, FormControl, IconButton, InputLabel, Paper, Tooltip, Typography } from '@mui/material';
import { Close, Edit, Emergency } from '@mui/icons-material';
import { common } from '@mui/material/colors';

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

const ParticipacionInstitucional = ({ people, viewOnly }) => {
    const dispatch = useDispatch();
    const containerRef = useRef(null);
    const token = useSelector((state) => state.user_cementerio_qr.data);

    const [width, setWidth] = useState(0);
    const [cargando, setCargando] = useState(false);
    const [openDanger, setOpenDanger] = useState(true);

    const [institucionesComunitarias, setInstitucionesComunitarias] = useState({});
    const [focusedInstitucionesComunitarias, setFocusedInstitucionesComunitarias] = useState(false);

    const [cargosDirectivos, setCargosDirectivos] = useState({});
    const [focusedCargosDirectivos, setFocusedCargosDirectivos] = useState(false);

    const [periodoParticipacion, setPeriodoParticipacion] = useState({});
    const [focusedPeriodoParticipacion, setFocusedPeriodoParticipacion] = useState(false);

    const [logrosReconocimientos, setLogrosReconocimientos] = useState({});
    const [focusedLogrosReconocimientos, setFocusedLogrosReconocimientos] = useState(false);

    const [proyectosImportantes, setProyectosImportantes] = useState({});
    const [focusedProyectosImportantes, setFocusedProyectosImportantes] = useState(false);

    const [legadoInstitucional, setLegadoInstitucional] = useState({});
    const [focusedLegadoInstitucional, setFocusedLegadoInstitucional] = useState(false);


    const handleGetInstitutionalData = useCallback(async () => {
        try {
            setCargando(true);

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'people_id': encryptMessage(String(people.id)),
                'participation_type': encryptMessage('SI')
            });

            const requestOptions = {
                method: 'POST',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/contributions/participation-data`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            if (responseJson.message !== null) {
                setInstitucionesComunitarias(JSON.parse(decryptMessage(responseJson.message.instituciones_fundadas)));
                setCargosDirectivos(JSON.parse(decryptMessage(responseJson.message.cargos_directivos)));
                setPeriodoParticipacion(JSON.parse(decryptMessage(responseJson.message.periodo_participacion)));
                setLogrosReconocimientos(JSON.parse(decryptMessage(responseJson.message.logros_reconocimientos)));
                setProyectosImportantes(JSON.parse(decryptMessage(responseJson.message.proyectos_importantes)));
                setLegadoInstitucional(JSON.parse(decryptMessage(responseJson.message.legado_institucional)));
            }
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
        finally {
            setCargando(false);
        }
    }, [people, token, dispatch, setCargando, encryptMessage, decryptMessage, setInstitucionesComunitarias, setCargosDirectivos, setPeriodoParticipacion, setLogrosReconocimientos, setProyectosImportantes, setLegadoInstitucional]);

    const handlePutInstitutionalData = useCallback(async () => {
        try {
            setCargando(true);

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'people_id': encryptMessage(String(people.id)),
                'participation_type': encryptMessage("SI"),
                'instituciones_fundadas': encryptMessage(JSON.stringify(institucionesComunitarias)),
                'cargos_directivos': encryptMessage(JSON.stringify(cargosDirectivos)),
                'periodo_participacion': encryptMessage(JSON.stringify(periodoParticipacion)),
                'logros_reconocimientos': encryptMessage(JSON.stringify(logrosReconocimientos)),
                'proyectos_importantes': encryptMessage(JSON.stringify(proyectosImportantes)),
                'legado_institucional': encryptMessage(JSON.stringify(legadoInstitucional))
            });

            const requestOptions = {
                method: 'PUT',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/contributions/participation-data`, requestOptions);
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
    }, [people, token, institucionesComunitarias, cargosDirectivos, periodoParticipacion, logrosReconocimientos, proyectosImportantes, legadoInstitucional, dispatch, setCargando, encryptMessage, decryptMessage]);


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
        handleGetInstitutionalData();
    }, [handleGetInstitutionalData]);

    return (
        <Fragment>
            {cargando ? (
                <Box component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                    <CircularProgress />
                    <Typography ml={2}>Procesando, espere...</Typography>
                </Box>
            ) : (
                <Fragment>
                    {!viewOnly && (
                        <Fragment>
                            <Box mb={2} position={'sticky'} top={185} zIndex={9} width={'fit-content'}>
                                <Button disableElevation variant='contained' color='primary' startIcon={<Edit />} onClick={handlePutInstitutionalData}>
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
                                        Datos obligatorios (Para los casos que aplique segun los aportes de la persona)
                                    </Box>
                                </Alert>
                            </Collapse>
                        </Fragment>
                    )}

                    <Box ref={containerRef} component={Paper} elevation={0} variant='outlined' display={'flex'} flexDirection={'column'} p={2}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedInstitucionesComunitarias ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                Instituciones comunitarias fundadas
                            </InputLabel>

                            <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                <ReactQuill
                                    value={institucionesComunitarias}
                                    onChange={(content, delta, source, editor) => setInstitucionesComunitarias(editor.getContents())}
                                    modules={modules}
                                    theme='snow'
                                    placeholder='Escribe algo...'
                                    style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                    onFocus={() => setFocusedInstitucionesComunitarias(true)}
                                    onBlur={() => setFocusedInstitucionesComunitarias(false)}
                                    readOnly={viewOnly}
                                    className='rounded'
                                />
                            </Box>
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedCargosDirectivos ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                Cargos directivos desempeñados
                            </InputLabel>

                            <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                <ReactQuill
                                    value={cargosDirectivos}
                                    onChange={(content, delta, source, editor) => setCargosDirectivos(editor.getContents())}
                                    modules={modules}
                                    theme='snow'
                                    placeholder='Escribe algo...'
                                    style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                    onFocus={() => setFocusedCargosDirectivos(true)}
                                    onBlur={() => setFocusedCargosDirectivos(false)}
                                    readOnly={viewOnly}
                                    className='rounded'
                                />
                            </Box>
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedPeriodoParticipacion ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                Periodo de participación activa
                            </InputLabel>

                            <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                <ReactQuill
                                    value={periodoParticipacion}
                                    onChange={(content, delta, source, editor) => setPeriodoParticipacion(editor.getContents())}
                                    modules={modules}
                                    theme='snow'
                                    placeholder='Escribe algo...'
                                    style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                    onFocus={() => setFocusedPeriodoParticipacion(true)}
                                    onBlur={() => setFocusedPeriodoParticipacion(false)}
                                    readOnly={viewOnly}
                                    className='rounded'
                                />
                            </Box>
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedLogrosReconocimientos ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                Logros y reconocimientos
                            </InputLabel>

                            <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                <ReactQuill
                                    value={logrosReconocimientos}
                                    onChange={(content, delta, source, editor) => setLogrosReconocimientos(editor.getContents())}
                                    modules={modules}
                                    theme='snow'
                                    placeholder='Escribe algo...'
                                    style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                    onFocus={() => setFocusedLogrosReconocimientos(true)}
                                    onBlur={() => setFocusedLogrosReconocimientos(false)}
                                    readOnly={viewOnly}
                                    className='rounded'
                                />
                            </Box>
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedProyectosImportantes ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                Proyectos importantes liderados
                            </InputLabel>

                            <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                <ReactQuill
                                    value={proyectosImportantes}
                                    onChange={(content, delta, source, editor) => setProyectosImportantes(editor.getContents())}
                                    modules={modules}
                                    theme='snow'
                                    placeholder='Escribe algo...'
                                    style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                    onFocus={() => setFocusedProyectosImportantes(true)}
                                    onBlur={() => setFocusedProyectosImportantes(false)}
                                    readOnly={viewOnly}
                                    className='rounded'
                                />
                            </Box>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedLegadoInstitucional ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                Legado institucional
                            </InputLabel>

                            <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                <ReactQuill
                                    value={legadoInstitucional}
                                    onChange={(content, delta, source, editor) => setLegadoInstitucional(editor.getContents())}
                                    modules={modules}
                                    theme='snow'
                                    placeholder='Escribe algo...'
                                    style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                    onFocus={() => setFocusedLegadoInstitucional(true)}
                                    onBlur={() => setFocusedLegadoInstitucional(false)}
                                    readOnly={viewOnly}
                                    className='rounded'
                                />
                            </Box>
                        </FormControl>
                    </Box>
                </Fragment>)}
        </Fragment>
    )
};

export default ParticipacionInstitucional;
