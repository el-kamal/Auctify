from datetime import datetime
import uuid

class SEPAService:
    @staticmethod
    def generate_sepa_xml(settlements: list, execution_date: datetime = None) -> str:
        """
        Generates a PAIN.001.001.03 XML file for the given settlements.
        """
        if not execution_date:
            execution_date = datetime.utcnow()
            
        msg_id = f"MSG-{uuid.uuid4().hex[:16].upper()}"
        cre_dt_tm = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")
        nb_of_txs = len(settlements)
        ctrl_sum = sum(s.amount for s in settlements)
        
        # Group by Auction? Or just one Payment Information block?
        # Let's assume one Payment Information block for simplicity.
        pmt_inf_id = f"PMT-{uuid.uuid4().hex[:16].upper()}"
        reqd_exctn_dt = execution_date.strftime("%Y-%m-%d")
        
        # Debtor (Auction House) Info - Mocked
        debtor_name = "AUCTIFY FRANCE"
        debtor_iban = "FR7630006000011234567890189"
        debtor_bic = "BNPARFXX"
        
        xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>{msg_id}</MsgId>
      <CreDtTm>{cre_dt_tm}</CreDtTm>
      <NbOfTxs>{nb_of_txs}</NbOfTxs>
      <CtrlSum>{ctrl_sum:.2f}</CtrlSum>
      <InitgPty>
        <Nm>{debtor_name}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>{pmt_inf_id}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>{nb_of_txs}</NbOfTxs>
      <CtrlSum>{ctrl_sum:.2f}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
      </PmtTpInf>
      <ReqdExctnDt>{reqd_exctn_dt}</ReqdExctnDt>
      <Dbtr>
        <Nm>{debtor_name}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>{debtor_iban}</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BIC>{debtor_bic}</BIC>
        </FinInstnId>
      </DbtrAgt>
      <ChrgBr>SLEV</ChrgBr>
"""

        for settlement in settlements:
            end_to_end_id = f"SET-{settlement.id}"
            remittance_info = f"Vente {settlement.auction.name} - Reglement Vendeur"
            
            # Use Seller IBAN/BIC or fallback
            creditor_iban = settlement.seller.iban or "FR7630006000011234567890189" # Fallback for demo
            creditor_bic = settlement.seller.bic or "BNPARFXX" # Fallback for demo
            
            xml += f"""      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>{end_to_end_id}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">{settlement.amount:.2f}</InstdAmt>
        </Amt>
        <CdtrAgt>
          <FinInstnId>
            <BIC>{creditor_bic}</BIC>
          </FinInstnId>
        </CdtrAgt>
        <Cdtr>
          <Nm>{settlement.seller.name}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>{creditor_iban}</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>{remittance_info}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>
"""

        xml += """    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>"""
        
        return xml
