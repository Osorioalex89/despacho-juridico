import { DataTypes } from 'sequelize'
import sequelize     from '../config/database.js'

const Case = sequelize.define('Caso', {
  id_caso: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true,
  },
  folio: {
    type:      DataTypes.STRING(20),
    allowNull: false,
    unique:    true,
  },
  asunto: {
    type:      DataTypes.STRING(150),
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM(
      'Penal',
      'Civil',
      'Amparo',
      'Sucesorio',
      'Contratos',
      'Trámite de escrituras',
      'Inscripción de posesión',
      'Asesoría legal'
    ),
    allowNull: false,
  },
  estado: {
    type:         DataTypes.ENUM('activo','urgente','pendiente','en_revision','cerrado'),
    allowNull:    false,
    defaultValue: 'activo',
  },
  descripcion: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
  id_cliente: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
  id_abogado: {
    type:      DataTypes.INTEGER,
    allowNull: true,
  },
  juzgado: {
    type:      DataTypes.STRING(150),
    allowNull: true,
  },
  exp_externo: {
    type:      DataTypes.STRING(50),
    allowNull: true,
  },
  contraparte: {
    type:      DataTypes.STRING(100),
    allowNull: true,
  },
  fecha_apertura: {
    type:      DataTypes.DATEONLY,
    allowNull: false,
  },
  fecha_limite: {
    type:      DataTypes.DATEONLY,
    allowNull: true,
  },
  notas: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
  reporte_ia: {
    type:      DataTypes.TEXT,
    allowNull: true,
  },
  reporte_ia_at: {
    type:      DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName:  'casos',
  timestamps: true,
})

export default Case