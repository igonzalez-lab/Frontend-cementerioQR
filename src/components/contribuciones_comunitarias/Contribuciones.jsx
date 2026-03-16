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

const Contribuciones = ({ people, viewOnly }) => {
    const dispatch = useDispatch();
    const containerRef = useRef(null);
    const token = useSelector((state) => state.user_cementerio_qr.data);

    const [width, setWidth] = useState(0);
    const [cargando, setCargando] = useState(false);
    const [openDanger, setOpenDanger] = useState(true);

    const [contribucionesCulturales, setContribucionesCulturales] = useState({});
    const [focusedContribucionesCulturales, setFocusedContribucionesCulturales] = useState(false);

    const [aportesEducativos, setAportesEducativos] = useState({});
    const [focusedAportesEducativos, setFocusedAportesEducativos] = useState(false);

    const [desarrolloEmpresarial, setDesarrolloEmpresarial] = useState({});
    const [focusedDesarrolloEmpresarial, setFocusedDesarrolloEmpresarial] = useState(false);

    const [trabajoFilantropico, setTrabajoFilantropico] = useState({});
    const [focusedTrabajoFilantropico, setFocusedTrabajoFilantropico] = useState(false);

    const [liderazgoReligioso, setLiderazgoReligioso] = useState({});
    const [focusedLiderazgoReligioso, setFocusedLiderazgoReligioso] = useState(false);

    const [actividadesDeportivas, setActividadesDeportivas] = useState({});
    const [focusedActividadesDeportivas, setFocusedActividadesDeportivas] = useState(false);

    const handleGetContributionData = useCallback(async () => {
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

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/contributions/contribution-data`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            if (responseJson.message !== null) {
                setContribucionesCulturales(JSON.parse(decryptMessage(responseJson.message.contribuciones_culturales)));
                setAportesEducativos(JSON.parse(decryptMessage(responseJson.message.aportes_educativos)));
                setDesarrolloEmpresarial(JSON.parse(decryptMessage(responseJson.message.desarrollo_empresarial)));
                setTrabajoFilantropico(JSON.parse(decryptMessage(responseJson.message.trabajo_filantropico)));
                setLiderazgoReligioso(JSON.parse(decryptMessage(responseJson.message.liderazgo_religioso)));
                setActividadesDeportivas(JSON.parse(decryptMessage(responseJson.message.actividades_deportivas)));
            }
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
        finally {
            setCargando(false);
        }
    }, [people, token, dispatch, setCargando, encryptMessage, decryptMessage, setContribucionesCulturales, setAportesEducativos, setDesarrolloEmpresarial, setTrabajoFilantropico, setLiderazgoReligioso, setActividadesDeportivas]);

    const handlePutContributionData = useCallback(async () => {
        try {
            setCargando(true);

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'people_id': encryptMessage(String(people.id)),
                'contribuciones_culturales': encryptMessage(JSON.stringify(contribucionesCulturales)),
                'aportes_educativos': encryptMessage(JSON.stringify(aportesEducativos)),
                'desarrollo_empresarial': encryptMessage(JSON.stringify(desarrolloEmpresarial)),
                'trabajo_filantropico': encryptMessage(JSON.stringify(trabajoFilantropico)),
                'liderazgo_religioso': encryptMessage(JSON.stringify(liderazgoReligioso)),
                'actividades_deportivas': encryptMessage(JSON.stringify(actividadesDeportivas))
            });

            const requestOptions = {
                method: 'PUT',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/contributions/contribution-data`, requestOptions);
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
    }, [people, token, contribucionesCulturales, aportesEducativos, desarrolloEmpresarial, trabajoFilantropico, liderazgoReligioso, actividadesDeportivas, dispatch, setCargando, encryptMessage, decryptMessage]);

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
        handleGetContributionData();
    }, [handleGetContributionData]);

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
                                <Button disableElevation variant='contained' color='primary' startIcon={<Edit />} onClick={handlePutContributionData}>
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
                            <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedContribucionesCulturales ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                Contribuciones culturales y académicos
                            </InputLabel>

                            <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                <ReactQuill
                                    value={contribucionesCulturales}
                                    onChange={(content, delta, source, editor) => setContribucionesCulturales(editor.getContents())}
                                    modules={modules}
                                    theme='snow'
                                    placeholder='Escribe algo...'
                                    style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                    onFocus={() => setFocusedContribucionesCulturales(true)}
                                    onBlur={() => setFocusedContribucionesCulturales(false)}
                                    readOnly={viewOnly}
                                    className='rounded'
                                />
                            </Box>
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedAportesEducativos ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                Aportes educativos y académicos
                            </InputLabel>

                            <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                <ReactQuill
                                    value={aportesEducativos}
                                    onChange={(content, delta, source, editor) => setAportesEducativos(editor.getContents())}
                                    modules={modules}
                                    theme='snow'
                                    placeholder='Escribe algo...'
                                    style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                    onFocus={() => setFocusedAportesEducativos(true)}
                                    onBlur={() => setFocusedAportesEducativos(false)}
                                    readOnly={viewOnly}
                                    className='rounded'
                                />
                            </Box>
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedDesarrolloEmpresarial ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                Desarrollo empresarial y económico
                            </InputLabel>

                            <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                <ReactQuill
                                    value={desarrolloEmpresarial}
                                    onChange={(content, delta, source, editor) => setDesarrolloEmpresarial(editor.getContents())}
                                    modules={modules}
                                    theme='snow'
                                    placeholder='Escribe algo...'
                                    style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                    onFocus={() => setFocusedDesarrolloEmpresarial(true)}
                                    onBlur={() => setFocusedDesarrolloEmpresarial(false)}
                                    readOnly={viewOnly}
                                    className='rounded'
                                />
                            </Box>
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedTrabajoFilantropico ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                Trabajo filantrópico y benéfico
                            </InputLabel>

                            <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                <ReactQuill
                                    value={trabajoFilantropico}
                                    onChange={(content, delta, source, editor) => setTrabajoFilantropico(editor.getContents())}
                                    modules={modules}
                                    theme='snow'
                                    placeholder='Escribe algo...'
                                    style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                    onFocus={() => setFocusedTrabajoFilantropico(true)}
                                    onBlur={() => setFocusedTrabajoFilantropico(false)}
                                    readOnly={viewOnly}
                                    className='rounded'
                                />
                            </Box>
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedLiderazgoReligioso ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                Liderazgo religioso y espiritual
                            </InputLabel>

                            <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                <ReactQuill
                                    value={liderazgoReligioso}
                                    onChange={(content, delta, source, editor) => setLiderazgoReligioso(editor.getContents())}
                                    modules={modules}
                                    theme='snow'
                                    placeholder='Escribe algo...'
                                    style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                    onFocus={() => setFocusedLiderazgoReligioso(true)}
                                    onBlur={() => setFocusedLiderazgoReligioso(false)}
                                    readOnly={viewOnly}
                                    className='rounded'
                                />
                            </Box>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel shrink sx={{ bgcolor: common['white'], px: 0.8, color: focusedActividadesDeportivas ? 'primary.main' : 'text.secondary', transition: 'color 0s', display: 'flex', alignItems: 'center' }}>
                                <Emergency color='error' fontSize='small' sx={{ mr: 0.2 }} />
                                Actividades deportivas y recreativas
                            </InputLabel>

                            <Box sx={{ border: '0px solid', '&:focus-within': { borderColor: 'primary.main', borderWidth: 1.7, }, }}>
                                <ReactQuill
                                    value={actividadesDeportivas}
                                    onChange={(content, delta, source, editor) => setActividadesDeportivas(editor.getContents())}
                                    modules={modules}
                                    theme='snow'
                                    placeholder='Escribe algo...'
                                    style={{ width: width - 35, fontFamily: 'Roboto, sans-serif' }}
                                    onFocus={() => setFocusedActividadesDeportivas(true)}
                                    onBlur={() => setFocusedActividadesDeportivas(false)}
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

export default Contribuciones;
