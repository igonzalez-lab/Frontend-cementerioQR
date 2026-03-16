import React, { useRef, forwardRef, useEffect, Fragment, useCallback, useState, useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { useDispatch, useSelector } from 'react-redux';

import { Download, Print, Warning } from '@mui/icons-material';
import { Box, Button, Paper, Typography } from '@mui/material';

import { decryptMessage, encryptMessage } from '../../helpers/helpers';
import { SHOW_ERROR_MESSAGE, SHOW_SUCCESS_MESSAGE } from '../../slices/notificationSlice';

const QRImprimible = forwardRef(({ value, people, qrBase64Encrypted }, ref) => (
    <Box ref={ref} textAlign='center' width='fit-content' height='fit-content'>
        {qrBase64Encrypted ? (
            <img
                src={decryptMessage(qrBase64Encrypted)}
                alt='QR generado'
                width={200}
                style={{ display: 'block' }}
            />
        ) : (
            <QRCodeCanvas value={value} size={200} />
        )}

        <Typography sx={{ mt: 1 }}>
            Escanea para ir ver a {decryptMessage(people.nombre_espanol)}
        </Typography>
    </Box>
));

const QrPagina = ({ people }) => {
    const dispatch = useDispatch();
    const token = useSelector((state) => state.user_cementerio_qr.data);

    const qrRef = useRef(null);
    const [qrCode, setQrCode] = useState(null);
    const [loading, setLoading] = useState(false);

    const qrUrl = useMemo(() => {
        if (!people) {
            return '';
        }

        return `http://localhost:5173/personas/${people.id}`;
    }, [people]);

    const handlePrint = useReactToPrint({
        contentRef: qrRef,
        documentTitle: 'QR generado',
        pageStyle: `
            @page { margin: 12mm; }
            @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
        `,
        onPrintError: (err) => {
            console.error('Error al imprimir:', err);
            dispatch(SHOW_ERROR_MESSAGE('No se pudo imprimir el QR.'));
        },
    });

    const handlePutData = useCallback(
        async (QrBase64) => {
            try {
                setLoading(true);

                if (!QrBase64) {
                    throw new Error('Complete código QR');
                }

                const requestHeader = new Headers();
                requestHeader.append('Authorization', `Bearer ${decryptMessage(token)}`);
                requestHeader.append('Content-Type', 'application/json');

                const requestBody = JSON.stringify({
                    people_id: encryptMessage(String(people.id)),
                    qr_image: encryptMessage(QrBase64),
                });

                const requestOptions = {
                    method: 'PUT',
                    headers: requestHeader,
                    body: requestBody,
                    redirect: 'follow',
                };

                const response = await fetch(`${import.meta.env.VITE_BACKEND_ADDRESS}/api-ajch/people/qr`, requestOptions);
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
        },
        [token, people, dispatch]
    );

    const handleSaveQRCode = useCallback(async () => {
        if (!people) {
            return;
        }

        if (people.imagen_qr) {
            setQrCode(people.imagen_qr);
            return;
        }

        const canvas = qrRef.current?.querySelector('canvas');

        if (!canvas) {
            return;
        }

        const base64 = canvas.toDataURL('image/png');
        await handlePutData(base64);

        const encrypted = encryptMessage(base64);
        setQrCode(encrypted);
    }, [people, handlePutData]);

    const downloadPNG = useCallback((base64, filename = 'qr.png') => {
        const link = document.createElement('a');
        link.href = base64;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    useEffect(() => {
        if (people !== null) {
            const t = setTimeout(() => {
                handleSaveQRCode();
            }, 0);

            return () => clearTimeout(t);
        }
    }, [people, handleSaveQRCode]);

    return (
        <Fragment>
            {people === null ? (
                <Box component={Paper} elevation={0} variant='outlined' display='flex' alignItems='center' p={2}>
                    <Warning fontSize='large' color='warning' />
                    <Typography ml={2}>Seleccione un usuario para continuar</Typography>
                </Box>
            ) : (
                <Box>
                    <Box textAlign='center' width='fit-content' height='fit-content'>
                        {qrCode ? (
                            <img src={decryptMessage(qrCode)} alt='QR generado' width={200} style={{ display: 'block' }} />
                        ) : (
                            <QRCodeCanvas value={qrUrl} size={200} />
                        )}

                        <Typography sx={{ mt: 1 }}>Escanea para ir ver a {decryptMessage(people.nombre_espanol)}</Typography>
                    </Box>

                    <Box sx={{ position: 'fixed', left: -10000, top: 0 }}>
                        <QRImprimible ref={qrRef} value={qrUrl} people={people} qrBase64Encrypted={qrCode} />
                    </Box>

                    <Box display='flex' alignItems='center' mt={2}>
                        <Button disableElevation color='primary' variant='contained' startIcon={<Download />} disabled={!qrCode || loading} onClick={() => downloadPNG(decryptMessage(qrCode))}>
                            <Typography variant='button'>Descargar Código QR</Typography>
                        </Button>

                        <Button disableElevation color='primary' variant='contained' startIcon={<Print />} sx={{ ml: 2 }} disabled={loading} onClick={() => {
                            if (!qrRef.current) {
                                dispatch(SHOW_ERROR_MESSAGE('Aún no está listo el QR para imprimir.'));
                                return;
                            }
                            handlePrint();
                        }}>
                            <Typography variant='button'>Imprimir Código QR</Typography>
                        </Button>
                    </Box>
                </Box>
            )}
        </Fragment>
    )
};

export default QrPagina;
