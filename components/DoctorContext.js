// DoctorContext.js
import React, { createContext, useState, useContext } from 'react';

const DoctorContext = createContext();

export const DoctorProvider = ({ children }) => {
    const [doctorId, setDoctorId] = useState(null);

    const login = (id) => {
        setDoctorId(id);
    };

    const logout = () => {
        setDoctorId(null);
    };

    return (
        <DoctorContext.Provider value={{ doctorId, login, logout }}>
            {children}
        </DoctorContext.Provider>
    );
};

export const useDoctor = () => useContext(DoctorContext);
