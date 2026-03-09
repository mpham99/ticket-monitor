export interface TicketType {
  id: number
  name: string
  color: string
  facePrice: number
}

export const ALL_TICKET_TYPES: TicketType[] = [
  { id: 1058172, name: 'Điêng Lên 1 (Standing)',    color: '#5bbee8', facePrice: 4000000 },
  { id: 1058173, name: 'Điêng Lên 2 (Standing)',    color: '#5bbee8', facePrice: 4000000 },
  { id: 1058174, name: 'Điêng Lên 3 (Standing)',    color: '#5bbee8', facePrice: 4000000 },
  { id: 1058175, name: 'Điêng Lên 4 (Standing)',    color: '#5bbee8', facePrice: 4000000 },
  { id: 1058176, name: 'Tinh Hoa (Standing)',        color: '#5183c2', facePrice: 4000000 },
  { id: 1058177, name: 'Thiếu Nhi (Standing)',       color: '#5282c4', facePrice: 3500000 },
  { id: 1058178, name: 'Mưa Lửa 1 (Standing)',      color: '#f1b65a', facePrice: 2500000 },
  { id: 1058179, name: 'Mưa Lửa 2 (Standing)',      color: '#f1b65a', facePrice: 2500000 },
  { id: 1058180, name: 'Hỏa Ca 1 (Standing)',        color: '#f7912b', facePrice: 1500000 },
  { id: 1058181, name: 'Hỏa Ca 2 (Standing)',        color: '#f7912b', facePrice: 1500000 },
  { id: 1058182, name: 'Hỏa Lực 1 (Standing)',       color: '#ec1d23', facePrice: 1000000 },
  { id: 1058183, name: 'Hỏa Lực 2 (Standing)',       color: '#ec1d23', facePrice: 1000000 },
  { id: 1058184, name: 'Gai Con 1 (Seated)',          color: '#1f9242', facePrice: 3500000 },
  { id: 1058185, name: 'Gai Con 2 (Seated)',          color: '#1f9242', facePrice: 3500000 },
  { id: 1058186, name: 'Đỉnh Nóc 1 (Seated)',        color: '#5c2d8d', facePrice: 3000000 },
  { id: 1058187, name: 'Đỉnh Nóc 2 (Seated)',        color: '#5c2d8d', facePrice: 3000000 },
  { id: 1058188, name: 'Kịch Trần 1 (Seated)',        color: '#a23e96', facePrice: 2500000 },
  { id: 1058189, name: 'Kịch Trần 2 (Seated)',        color: '#a23e96', facePrice: 2500000 },
  { id: 1058190, name: 'Mứt Gừng 1 (Seated)',        color: '#99b53c', facePrice: 2500000 },
  { id: 1058191, name: 'Mứt Gừng 2 (Seated)',        color: '#99b53c', facePrice: 2500000 },
  { id: 1058192, name: 'Bay Phấp Phới 1 (Seated)',   color: '#da2282', facePrice: 2000000 },
  { id: 1058193, name: 'Bay Phấp Phới 2 (Seated)',   color: '#da2282', facePrice: 2000000 },
  { id: 1058194, name: 'Nhà Trẻ 1 (Seated)',         color: '#293f94', facePrice: 2000000 },
  { id: 1058195, name: 'Nhà Trẻ 2 (Seated)',         color: '#293f94', facePrice: 2000000 },
  { id: 1058196, name: 'Chín Muồi 1 (Seated)',       color: '#04b4a9', facePrice: 1500000 },
  { id: 1058197, name: 'Chín Muồi 2 (Seated)',       color: '#04b4a9', facePrice: 1500000 },
  { id: 1058198, name: 'Cá Lớn 1 (Seated)',          color: '#0b6259', facePrice: 1000000 },
  { id: 1058199, name: 'Cá Lớn 2 (Seated)',          color: '#0b6259', facePrice: 1000000 },
  { id: 1058861, name: 'Star Lounge',                 color: '#ef5e25', facePrice: 6000000 },
]

export const TICKET_TYPE_MAP = new Map<number, TicketType>(
  ALL_TICKET_TYPES.map(t => [t.id, t])
)
