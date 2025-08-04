<<<<<<< HEAD
CREATE TABLE seguimiento_calibraciones (
    id SERIAL PRIMARY KEY,
    parametro VARCHAR(255) NOT NULL,
    frecuencia_sugerida VARCHAR(255) NOT NULL,
    observaciones TEXT,
    referencia_normativa VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
=======
CREATE TABLE seguimiento_calibraciones (
    id SERIAL PRIMARY KEY,
    parametro VARCHAR(255) NOT NULL,
    frecuencia_sugerida VARCHAR(255) NOT NULL,
    observaciones TEXT,
    referencia_normativa VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
>>>>>>> 03f330083664a924fa75f79be9e8bf095aaf26bb
