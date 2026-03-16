import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { common } from '@mui/material/colors';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Alert, Box, Checkbox, CircularProgress, FormControlLabel, Paper, Tab, Typography } from '@mui/material';

import { decryptMessage, encryptMessage } from '../../helpers/helpers';
import { SHOW_ERROR_MESSAGE, SHOW_SUCCESS_MESSAGE } from '../../slices/notificationSlice';

import Migracion from './Migracion';
import Sobrevivientes from './Sobrevivientes';

const Index = ({ people, viewOnly }) => {
    const dispatch = useDispatch();
    const token = useSelector((state) => state.user_cementerio_qr.data);

    const [survive, setSurvive] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [tabPosition, setTabPosition] = useState('1');

    const handleGetState = useCallback(async () => {
        try {
            setCargando(true);

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'people_id': encryptMessage(String(people.id)),
            });

            const requestOptions = {
                method: 'POST',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/survive/state`, requestOptions);
            const responseJson = await response.json();

            if (responseJson.error) {
                throw new Error(responseJson.message);
            }

            if (responseJson.message === null) {
                setSurvive(false);
            } else if (responseJson.message.es_sobreviviente === 'NO') {
                setSurvive(false);
            } else {
                setSurvive(true);
            }
        }
        catch (error) {
            dispatch(SHOW_ERROR_MESSAGE(error.message));
        }
        finally {
            setCargando(false);
        }
    }, [people, token, dispatch, setSurvive, setCargando, encryptMessage, decryptMessage]);

    const handlePutState = useCallback(async (payload) => {
        try {
            setCargando(true);

            const requestHeader = new Headers();
            requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
            requestHeader.append('Content-Type', 'application/json');

            const requestBody = JSON.stringify({
                'people_id': encryptMessage(String(people.id)),
                'survive_type': encryptMessage(payload ? 'SI' : 'NO')
            });

            const requestOptions = {
                method: 'PUT',
                headers: requestHeader,
                body: requestBody,
                redirect: 'follow'
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/survive/state`, requestOptions);
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
    }, [people, token, dispatch, setCargando, encryptMessage, decryptMessage]);

    const handleChangeState = useCallback(async (payload) => {
        setSurvive(payload);
        await handlePutState(payload);
    }, [setSurvive, handlePutState]);

    useEffect(() => {
        handleGetState();
    }, []);

    return (
        <Fragment>
            {!viewOnly && (
                <Alert severity='info' sx={{ mb: 2 }}>
                    Indica primero si la persona es un sobreviviente del holocausto o no, para continuar con el formulario, Se actualizará al marcar la selección.
                </Alert>
            )}

            {cargando ? (
                <Box component={Paper} elevation={0} variant='outlined' display={'flex'} alignItems={'center'} p={2}>
                    <CircularProgress />
                    <Typography ml={2}>Procesando, espere...</Typography>
                </Box>
            ) : (
                <Fragment>
                    {viewOnly ? (
                        <Alert severity='info' sx={{ mb: 2 }}>
                            {survive ? 'Si es un sobreviviente del Holocausto' : 'No corresponde como sobreviviente del Holocausto'}
                        </Alert>
                    ) : (
                        <Box display={'flex'} alignItems={'center'} flexWrap={'wrap'}>
                            <FormControlLabel control={<Checkbox defaultChecked checked={survive} onChange={(e) => handleChangeState(e.target.checked)} />} label='Sobreviviente del holocausto?' sx={{ mr: 2, mb: 2 }} />
                        </Box>
                    )}

                    <Box component={Paper} elevation={0} variant='outlined' >
                        <TabContext value={tabPosition}>
                            <Box borderBottom={0.1} borderColor={'divider'} position={'sticky'} top={112.5} bgcolor={common['white']} zIndex={10} sx={{ borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
                                <TabList onChange={(e, v) => setTabPosition(v)} variant='scrollable'>
                                    <Tab label='Información de Sobreviviente' value='1' />
                                    <Tab label='Historia de Migración Post Holocausto' value='2' />
                                </TabList>
                            </Box>
                            <TabPanel value='1'>
                                <Sobrevivientes people={people} survive={survive} viewOnly={viewOnly} />
                            </TabPanel>
                            <TabPanel value='2'>
                                <Migracion people={people} survive={survive} viewOnly={viewOnly} />
                            </TabPanel>
                        </TabContext>
                    </Box>
                </Fragment>
            )}
        </Fragment>
    )
};

export default Index;
