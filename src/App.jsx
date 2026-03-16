import React, { Fragment, lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';

const Login = lazy(() => import('./components/auth/Login'));
const Notificacion = lazy(() => import('./components/layout/Notification'));

const App = () => {
	const user = useSelector(state => state.user_cementerio_qr.data);

	return (
		<Fragment>
			<Suspense>
				<BrowserRouter>
					<Fragment>
						{user ? (
							<Navbar />
						) : (
							<Routes>
								<Route path='/' element={<Login />} />
							</Routes>
						)}
					</Fragment>
				</BrowserRouter>

				<Notificacion />
			</Suspense>
		</Fragment>
	)
};

export default App;
