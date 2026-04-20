import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    data: null,
};

const userSlice = createSlice({
    name: 'user_cementerio_qr',
    initialState,
    reducers: {
        SET_USER_DATA: (state, action) => {
            state.data = action.payload;
        },
        CLEAR_USER_DATA: (state) => {
            state.data = null;
        }
    }
});

export const { SET_USER_DATA, CLEAR_USER_DATA } = userSlice.actions;

export default userSlice.reducer;