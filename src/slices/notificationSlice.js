import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    state: false,
    message: '',
    severity: 'info',
};

const notificacionSlice = createSlice({
	name: 'notification_cementerio_qr',
	initialState,
	reducers: {
		SHOW_ERROR_MESSAGE: (state, action) => {
			state.state = false;

			state.message = action.payload;
			state.severity = 'error';
			state.state = true;
		},
		SHOW_SUCCESS_MESSAGE: (state, action) => {
			state.state = false;

			state.message = action.payload;
			state.severity = 'success';
			state.state = true;
		},
		SHOW_WARNING_MESSAGE: (state, action) => {
			state.state = false;

			state.message = action.payload;
			state.severity = 'warning';
			state.state = true;
		},
		SHOW_INFORMATION_MESSAGE: (state, action) => {
			state.state = false;

			state.message = action.payload;
			state.severity = 'info';
			state.state = true;
		},
		HIDE_MESSAGE: (state) => {
			state.state = false;
		},
	}
});

export const { SHOW_ERROR_MESSAGE, SHOW_SUCCESS_MESSAGE, SHOW_WARNING_MESSAGE, SHOW_INFORMATION_MESSAGE, HIDE_MESSAGE } = notificacionSlice.actions;

export default notificacionSlice.reducer;