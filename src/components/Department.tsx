import React from 'react'

type DepartmentVariant = 'RA' | 'MA' | 'Branding' | 'Legal'

interface DepartmentProps {
  variant: DepartmentVariant
}

const colorMap: Record<DepartmentVariant, string> = {
  RA: '#C862FF',
  MA: '#FC803E',
  Branding: '#4CBFFD',
  Legal: '#45BF65',
}

const Department: React.FC<DepartmentProps> = ({ variant }) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 8px',
        borderRadius: '2px',
        backgroundColor: colorMap[variant],
        color: '#fff',
        fontSize: '12px',
        fontFamily: "'PingFang SC', sans-serif",
        fontWeight: 400,
        lineHeight: '18px',
        whiteSpace: 'nowrap',
      }}
    >
      {variant}
    </span>
  )
}

export default Department
