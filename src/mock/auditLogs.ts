
import { AuditLog } from '@/types';

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    user_id: 1,
    action: "Arday Lagu Daray",
    details: "Waxaa lagu daray ardayga 'Cabdiraxman Maxamed' lambarkiisa 'EAUGRW0002763'",
    timestamp: new Date(2023, 5, 10, 9, 30)
  },
  {
    id: 2,
    user_id: 2,
    action: "Soo Dejin Wadar",
    details: "Waxaa la soo dejiyay 25 arday oo ka yimid faylka CSV",
    timestamp: new Date(2023, 5, 9, 14, 15)
  },
  {
    id: 3,
    user_id: 1,
    action: "Arday La Cusbooneysiiyay",
    details: "Waxaa la cusbooneysiiyay macluumaadka ardayga 'Faadumo Yuusuf' lambarkiisa 'EAUGRW0001245'",
    timestamp: new Date(2023, 5, 8, 11, 45)
  },
  {
    id: 4,
    user_id: 3,
    action: "Dukumenti La Soo Geliyay",
    details: "Waxaa la soo geliyay shahaadada ardayga lambarkiisa 'EAUGRW0005142'",
    timestamp: new Date(2023, 5, 7, 16, 20)
  },
  {
    id: 5,
    user_id: 2,
    action: "Arday La Tirtiray",
    details: "Waxaa la tirtiray ardayga 'Cabdullaahi Xasan Faarax' lambarkiisa 'EAUGRW001245'",
    timestamp: new Date(2023, 5, 6, 10, 5)
  }
];
