// Agregué useMemo a las importaciones
import React, { Fragment, useCallback, useRef, useState, useMemo } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { AppBar, Avatar, Box, CssBaseline, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, MenuList, Paper, Toolbar, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { AdminPanelSettings, FormatListBulleted, Home, LinearScale, Logout, Menu as MenuIcon, People } from '@mui/icons-material';
import { common } from '@mui/material/colors';

import { CLEAR_USER_DATA } from '../../slices/userSlice';
import { decryptMessage } from '../../helpers/helpers';
import { jwtDecode } from 'jwt-decode';

import IndexCementerios from '../cementerios/Index';
import IndexTimeline from '../timeline/Index';
import DetailPeople from '../people/Detail';
import IndexPeople from '../people/Index';
import IndexDetail from '../detail/Index';
import IndexAdmin from '../admin/Index';
import IndexHome from '../home/Index';

const drawWidth = 220;

const Navbar = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const appBarRef = useRef(null);
    const token = useSelector((state) => state.user_cementerio_qr.data);
    const matchesSm = useMediaQuery(theme.breakpoints.between('xs', 'sm'));

    const [anchorEl, setAnchorEl] = useState(null);
    const [mobileViewOpen, setMobileViewOpen] = useState(false);

    // Centralicé la desencriptación del token en este useMemo. 
    // Lo hice porque hacerlo directo en el render me rompía la app al intentar desencriptar lo mismo varias veces y ponía el navegador súper lento.
    const userData = useMemo(() => {
        if (!token) return null;
        try {
            const decodedToken = jwtDecode(decryptMessage(token));
            return {
                name: decryptMessage(decryptMessage(decodedToken.name)),
                surname: decryptMessage(decryptMessage(decodedToken.surname)),
                username: decryptMessage(decryptMessage(decodedToken.username)),
                role: String(decryptMessage(decodedToken.role))
            };
        } catch (error) {
            console.error("Error al decodificar token", error);
            return null;
        }
    }, [token]);

    const handleSelectNavItem = useCallback(async (path) => {
        setAnchorEl(null);
        setMobileViewOpen(false);
        await navigate(path);
    }, [navigate, setAnchorEl, setMobileViewOpen]);

    const handleCloseSession = useCallback(async () => {
        dispatch(CLEAR_USER_DATA());
        await navigate('/');
    }, [dispatch, navigate]);

    const stringToColor = useCallback((string) => {
        let hash = 0;
        let i;

        /* eslint-disable no-bitwise */
        for (i = 0; i < string.length; i += 1) {
            hash = string.charCodeAt(i) + ((hash << 5) - hash);
        }

        let color = '#';

        for (i = 0; i < 3; i += 1) {
            const value = (hash >> (i * 8)) & 0xff;
            color += `00${value.toString(16)}`.slice(-2);
        }
        /* eslint-enable no-bitwise */

        return color;
    }, []);

    const stringAvatar = useCallback((name) => {
        return {
            sx: {
                bgcolor: stringToColor(name),
            },
            children: `${name.split(' ')[0][0]}${name.split(' ')[1][0]}`,
        };
    }, [stringToColor]);

    const responsiveDrawer = (
        <Box height={'100%'} bgcolor={common['white']}>
            <Toolbar children={
                <Box onClick={() => handleSelectNavItem('/')} display={'flex'} justifyContent={'center'} alignItems={'center'} color={common['black']} m={'auto'} sx={{ textDecoration: 'none', cursor: 'pointer' }}>
                    <img src='../images/logo.png' alt='Archivo Judío de Chile' width={110} height={'auto'} />
                </Box>
            } />

            <Divider />

            <List>
                <Tooltip placement='right' title='Ir a Menú Principal'>
                    <ListItemButton onClick={() => handleSelectNavItem('/')}>
                        <ListItemIcon>
                            <Home />
                        </ListItemIcon>
                        <ListItemText primary='Menú Principal' />
                    </ListItemButton>
                </Tooltip>

                {/* Reemplacé las llamadas largas al token por userData.role */}
                {userData?.role === '5' && (
                    <Tooltip placement='right' title='Ir a Admin. Usuarios'>
                        <ListItemButton onClick={() => handleSelectNavItem('/admin')}>
                            <ListItemIcon>
                                <AdminPanelSettings />
                            </ListItemIcon>
                            <ListItemText primary='Admin. Usuarios' />
                        </ListItemButton>
                    </Tooltip>
                )}

                <Tooltip placement='right' title='Ir a Personas'>
                    <ListItemButton onClick={() => handleSelectNavItem('/personas')}>
                        <ListItemIcon>
                            <People />
                        </ListItemIcon>
                        <ListItemText primary='Personas' />
                    </ListItemButton>
                </Tooltip>

                {/* Reemplacé las llamadas largas al token por userData.role */}
                {userData?.role !== '2' && (
                    <Tooltip placement='right' title='Ir a Cementerios'>
                        <ListItemButton onClick={() => handleSelectNavItem('/cementerios')}>
                            <ListItemIcon>
                                <FormatListBulleted />
                            </ListItemIcon>
                            <ListItemText primary='Cementerios' />
                        </ListItemButton>
                    </Tooltip>
                )}

                {/* Reemplacé las llamadas largas al token por userData.role */}
                {userData?.role !== '2' && (
                    <Tooltip placement='right' title='Ir a Linea de Tiempo General'>
                        <ListItemButton onClick={() => handleSelectNavItem('/linea-tiempo')}>
                            <ListItemIcon>
                                <LinearScale />
                            </ListItemIcon>
                            <ListItemText primary='Linea de Tiempo General' />
                        </ListItemButton>
                    </Tooltip>
                )}
            </List>
        </Box>
    );

    return (
        <Fragment>
            <Box display={'flex'}>
                <CssBaseline />

                <AppBar elevation={0} variant='outlined' position={'fixed'} ref={appBarRef} sx={{ width: { sm: `calc(100% - ${drawWidth}px)` }, ml: { sm: `${drawWidth}px` }, backgroundColor: common['white'], color: common['black'], borderTop: 0, borderLeft: 0, borderRight: 0 }}>
                    <Toolbar>
                        <IconButton color={'inherit'} edge={'start'} onClick={() => setMobileViewOpen(!mobileViewOpen)} sx={{ ml: -1, display: { sm: 'none' } }}>
                            <MenuIcon />
                        </IconButton>

                        <Box onClick={() => handleSelectNavItem('/')} display={'flex'} justifyContent={'center'} alignItems={'center'} color={common['black']} sx={{ textDecoration: 'none', cursor: 'pointer' }}>
                            {matchesSm && (
                                <img src='../images/logo.png' alt='Archivo Judío de Chile' width={110} height={'auto'} style={{ marginLeft: 7 }} />
                            )}
                        </Box>

                        <Box width={'fit-content'} ml={'auto'}>
                            {/* Limpié el código usando los datos procesados en userData */}
                            <Tooltip title={`${userData?.name} ${userData?.surname}`}>
                                <IconButton size='large' onClick={(e) => setAnchorEl(e.currentTarget)} color='inherit' sx={{ float: 'right', width: 50, height: 50 }}>
                                    <Avatar {...stringAvatar(`${userData?.name} ${userData?.surname}`)} />
                                </IconButton>
                            </Tooltip>

                            <Menu id='menu-appbar' keepMounted anchorEl={anchorEl} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} open={Boolean(anchorEl)} sx={{ mt: matchesSm ? 7 : 9 }} onClose={() => setAnchorEl(null)}>
                                <Box component={Paper} elevation={0} width={320} maxWidth={'100%'} m={'auto'} overflow={'auto'}>
                                    <Box display={'flex'} mt={-1}>
                                        <Box m={1.3}>
                                            <Avatar {...stringAvatar(`${userData?.name} ${userData?.surname}`)} />
                                        </Box>

                                        <Box display={'flex'} flexDirection={'column'} mt={1} mb={1}>
                                            <Typography variant='body1'>{`${userData?.name} ${userData?.surname}`}</Typography>
                                            <Typography variant='body2'>{userData?.username}</Typography>
                                        </Box>
                                    </Box>

                                    <Divider />

                                    <MenuList>
                                        <MenuItem onClick={handleCloseSession} sx={{ mb: -1 }}>
                                            <ListItemIcon>
                                                <Logout fontSize='small' />
                                            </ListItemIcon>
                                            <ListItemText>Cerrar Sesión</ListItemText>
                                        </MenuItem>
                                    </MenuList>
                                </Box>
                            </Menu>
                        </Box>
                    </Toolbar>
                </AppBar>

                <Box component='nav' sx={{ width: { sm: drawWidth }, flexShrink: { sm: 0 } }}>
                    <Drawer variant='temporary' open={mobileViewOpen} onClose={() => setMobileViewOpen(!mobileViewOpen)} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawWidth, backgroundColor: common['white'] } }}>
                        {responsiveDrawer}
                    </Drawer>

                    <Drawer variant='permanent' sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawWidth, backgroundColor: common['white'] } }} open>
                        {responsiveDrawer}
                    </Drawer>
                </Box>

                <Box component='main' flexGrow={1} p={3} height={'100vh'} sx={{ width: { sm: `calc(100% - ${drawWidth}px)` } }}>
                    <Toolbar />

                    <Routes>
                        <Route element={<IndexHome />} path='/' />
                        <Route element={<IndexAdmin />} path='/admin' />
                        <Route element={<IndexPeople />} path='/personas' />
                        <Route element={<IndexDetail />} path='/personas/:id' />
                        <Route element={<IndexCementerios />} path='/cementerios' />
                        <Route element={<DetailPeople />} path='/personas/detalle' />
                        <Route element={<IndexTimeline people={null} viewOnly={false} personal={false} />} path='/linea-tiempo' />
                    </Routes>
                </Box>
            </Box>
        </Fragment>
    )
};

export default Navbar;