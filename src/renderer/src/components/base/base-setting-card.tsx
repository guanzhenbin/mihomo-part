import React from 'react'
import { Accordion, AccordionItem, Card, CardBody } from '@heroui/react'

interface Props {
  title?: string
  children?: React.ReactNode
  className?: string
}

const SettingCard: React.FC<Props> = (props) => {
  return !props.title ? (
    <Card className={`${props.className} backdrop-blur-3xl bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-amber-500/[0.03] border border-white/10 rounded-3xl shadow-2xl shadow-black/30 bg-transparent`}>
      <CardBody className="p-8">{props.children}</CardBody>
    </Card>
  ) : (
    <Accordion 
      isCompact 
      className={`${props.className} backdrop-blur-3xl bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-amber-500/[0.03] border border-white/10 rounded-3xl shadow-2xl shadow-black/30`} 
      variant="splitted" 
      {...props}
    >
      <AccordionItem
        className="data-[open=true]:pb-2 text-white"
        hideIndicator
        keepContentMounted
        title={props.title}
        classNames={{
          title: "text-white font-semibold text-lg",
          content: "px-8 pb-8"
        }}
      >
        {props.children}
      </AccordionItem>
    </Accordion>
  )
}

export default SettingCard
